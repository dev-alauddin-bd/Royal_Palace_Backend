import { Request, Response } from "express";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { bookingServices } from "../services/booking.services";
import sendResponse from "../utils/handeller/sendResponse";

// =====================================================Initiate Booking========================================

const initiateBooking = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const bookingData = req.body;

    const { paymentUrl, transactionId } =
      await bookingServices.bookingInitialization(bookingData);
      
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Booking and payment initialized successfully",
      data: {
        transactionId: transactionId,
        paymentUrl: paymentUrl,
      },
    });
  },
);

// ========================================Avalabe rooms For Booking=================================================

const checkAvailableRoomsById = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const blockedDates = await bookingServices.getBookedDatesForRoomByRoomId(
      roomId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Available rooms fetched successfully",
      data: blockedDates,
    });
  },
);

// ======================================== chek booking rooms by user id=================================================

const checkbookingRoomsByUserId = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const bookedRooms = await bookingServices.getBookedRoomsByUserId(
      id as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Booked rooms fetched successfully",
      data: bookedRooms,
    });
  },
);

// =====================================filter booking===========================================

const getFilteredBookings = catchAsyncHandeller(async (req: Request, res: Response) => {
  const result = await bookingServices.filterBookings(req.query);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Filtered bookings fetched successfully",
    data: result,
  });
});

const cancelBooking = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await bookingServices.cancelBookingService(id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Booking has been successfully cancelled",
      data: result.booking,
    });
  },
);

// ========================Exxport Controller=============================
export const bookingController = {
  initiateBooking,
  checkAvailableRoomsById,
  cancelBooking,
  getFilteredBookings,
  checkbookingRoomsByUserId,
};
