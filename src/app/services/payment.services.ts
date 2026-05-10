import sanitize from "mongo-sanitize";
import dotenv from "dotenv";
import SSLCommerzPayment from "sslcommerz-lts";

import PaymentModel from "../mongoSchema/payment.schema";
import BookingModel from "../mongoSchema/booking.schema";
import { AppError } from "../error/appError";
import { PaymentStatus } from "../interfaces/payment.interfaces";



// ====================================================
// 🔹 IPN Handler (FINAL AUTHORITY)
// ====================================================
const handleIPN = async (ipnData: any) => {
  const tranId = sanitize(ipnData.tran_id);
  const status = ipnData.status;

  if (!tranId) {
    throw new AppError("Invalid IPN payload", 400);
  }

  if (status === "VALID") {
    await BookingModel.findOneAndUpdate(
      { transactionId: tranId },
      { paymentStatus: "PAID" },
    );

    await PaymentModel.findOneAndUpdate(
      { transactionId: tranId },
      {
        status: "SUCCESS",
        ipnData,
      },
    );
  }

  if (status === "FAILED") {
    await BookingModel.findOneAndUpdate(
      { transactionId: tranId },
      { paymentStatus: "FAILED" },
    );

    await PaymentModel.findOneAndUpdate(
      { transactionId: tranId },
      {
        status: "FAILED",
        ipnData,
      },
    );
  }

  return true;
};

// ====================================================
// 🔹 Get Payments (Admin)
// ====================================================
import { genericQuery } from "../utils/queryUtils";

const getPayments = async (query: any) => {
  const result = await genericQuery({
    model: PaymentModel,
    query,
    searchFields: ["transactionId", "status"],
    lookup: [
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "bookingDetails",
        },
      },
      { $unwind: { path: "$bookingDetails", preserveNullAndEmptyArrays: true } },
    ],
  });

  return result;
};

// ====================================================
// 🔹 Get Payments by User
// ====================================================
const getPaymentsByUserId = async (userId: string) => {
  userId = sanitize(userId);

  const payments = await PaymentModel.find({ userId })
    .populate("bookingId")
    .sort({ createdAt: -1 });

  return payments;
};

// ====================================================
// 🔹 Export Service
// ====================================================
export const paymentServices = {
  
  handleIPN,
  getPayments,
  getPaymentsByUserId,
};
