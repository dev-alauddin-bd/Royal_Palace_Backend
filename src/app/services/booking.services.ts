import mongoose from "mongoose";

import { add, differenceInDays } from "date-fns";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { BookingStatus, IBooking } from "../interfaces/booking.interfcae";
import { AppError } from "../error/appError";
import { PaymentStatus } from "../interfaces/payment.interfaces";
import PaymentModel from "../mongoSchema/payment.schema";
import BookingModel from "../mongoSchema/booking.schema";


import { roomsCalculates } from "../utils/roomCalculations";
import { checkConflictedRooms } from "../utils/checkRoomAvailablity";
import { calculateTotalAmount } from "../utils/caculateAmount";
import { getDateRangeArray } from "../utils/getDateRangeArray";
import { sslcommerzPaymentInit } from "../utils/sslCommerzPayment";

// ======================================= Get Booked Dates For Room =================================
const getBookedDatesForRoomByRoomId = async (roomId: string) => {
  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    throw new AppError("Invalid or missing Room ID", 400);
  }

  const today = dayjs().startOf("day");

  const bookings = await BookingModel.find({
    bookingStatus: { $in: [BookingStatus.Confirmed] },
    "rooms.roomId": new mongoose.Types.ObjectId(roomId),
  }).select("rooms -_id");

  const detailBookedDates: { checkInDate: string; checkOutDate: string }[] = [];
  const bookedDatesSet = new Set<string>();

  for (const booking of bookings) {
    for (const room of booking.rooms) {
      if (
        room.roomId.toString() === roomId &&
        dayjs(room.checkOutDate).isSameOrAfter(today)
      ) {
        detailBookedDates.push({
          checkInDate: dayjs(room.checkInDate).format("YYYY-MM-DD"),
          checkOutDate: dayjs(room.checkOutDate).format("YYYY-MM-DD"),
        });

        const datesInRange = getDateRangeArray(
          dayjs(room.checkInDate).format("YYYY-MM-DD"),
          dayjs(room.checkOutDate).format("YYYY-MM-DD"),
        );
        datesInRange.forEach((date) => bookedDatesSet.add(date));
      }
    }
  }

  return {
    detailBookedDates,
    bookedDates: Array.from(bookedDatesSet).sort(),
  };
};

// ======================================= Get Booked rooms By User ID =================================
const getBookedRoomsByUserId = async (userId: string) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid or missing User ID", 400);
  }

  const bookings = await BookingModel.find({ userId })
    .populate("rooms.roomId")
    .sort({ createdAt: -1 });

  return bookings;
};

// ======================================= Filter Bookings ============================================
import { genericQuery } from "../utils/queryUtils";

const filterBookings = async (queryParams: any) => {
  const result = await genericQuery({
    model: BookingModel,
    query: queryParams,
    searchFields: ["name", "email", "phone", "transactionId"],
    lookup: [
      {
        $lookup: {
          from: "rooms",
          localField: "rooms.roomId",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
    ],
  });

  return result;
};

// ========================================= Cancel Booking ============================================
const cancelBookingService = async (bookingId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await BookingModel.findOne({ _id: bookingId }).session(
      session,
    );

    if (!booking) {
      return {
        success: false,
        statusCode: 404,
        message: "Booking not found",
      };
    }

    if (booking.bookingStatus !== BookingStatus.Confirmed) {
      return {
        success: false,
        statusCode: 400,
        message: `Booking status is '${booking.bookingStatus}', so cannot cancel.`,
      };
    }

    // Cancel Booking
    booking.bookingStatus = BookingStatus.Cancelled;
    await booking.save({ session });

    // Update Payment status to "cancelled"
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: booking.transactionId },
      { status: "claimRefund" },
      { new: true, session },
    );

    await session.commitTransaction();

    return {
      success: true,
      booking,
      payment,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const bookingInitialization = async (bookingData: IBooking) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, rooms, name, email, city, address, phone, postcode } =
      bookingData;

    //  rooms calculate
    const roomsForCalculation = roomsCalculates(rooms as any);

    // check conflict rooms
    await checkConflictedRooms(roomsForCalculation);

    //  calculate total amount
    const totalAmount = calculateTotalAmount(roomsForCalculation);

    // Generate Transaction ID
    const transactionId =
      "TXN" + Date.now() + Math.floor(Math.random() * 1000);

    // Create booking (PENDING)
    const booking = await BookingModel.create(
      [
        {
          userId,
          rooms,
          totalAmount,
          transactionId,
          bookingStatus: BookingStatus.Pending,
          name,
          email,
          city,
          address,
          phone,
          postcode,
        },
      ],
      { session },
    );

    //  Prevent duplicate PAID payment
    const paidPayment = await PaymentModel.findOne(
      {
        bookingId: booking[0]._id,
        status: PaymentStatus.SUCCESS,
      },
      null,
      { session },
    );

    if (paidPayment) {
      throw new AppError("Payment already completed", 400);
    }

    const nights = roomsForCalculation?.[0]?.nights;

    // Create / Update payment (PENDING)
    await PaymentModel.findOneAndUpdate(
      { transactionId },
      {
        bookingId: booking[0]._id,
        userId,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
      },
      { upsert: true, new: true, session },
    );

    //Commit transaction
    await session.commitTransaction();



    //  Payment gateway call
    const paymntData = {
      name,
      email,
      phone,
      address,
      postcode,
      city,
      totalAmount,
      transactionId,
      nights,
      userId,
      _id: booking[0]._id,
    };

    const { paymentUrl } = await sslcommerzPaymentInit(
      paymntData as IBooking,
    );

    return {
      transactionId,
      paymentUrl,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

// ======================== Export Services =============================
export const bookingServices = {
  bookingInitialization,
  getBookedDatesForRoomByRoomId,
  cancelBookingService,
  filterBookings,
  getBookedRoomsByUserId,
};
