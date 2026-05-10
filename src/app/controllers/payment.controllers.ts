import { Request, Response } from "express";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { paymentServices } from "../services/payment.services";
import sanitize from "mongo-sanitize";
import PaymentModel from "../mongoSchema/payment.schema";
import { PaymentStatus } from "../interfaces/payment.interfaces";
import BookingModel from "../mongoSchema/booking.schema";
import { BookingStatus } from "../interfaces/booking.interfcae";
import sendResponse from "../utils/handeller/sendResponse";

// ====================================================
// 🔹 SSLCommerz IPN (FINAL AUTHORITY)
// POST /payments/ipn
// ====================================================
const handleIPN = catchAsyncHandeller(async (req: Request, res: Response) => {
  await paymentServices.handleIPN(req.body);

  // ⚠️ SSLCommerz expects 200 OK
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "IPN handled successfully",
    data: null,
  });
});

// ====================================================
// 🔹 PAYMENT SUCCESS REDIRECT
// GET /payments/success
// ====================================================
export const paymentSuccess = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    // SSLCommerz fallback
    const tranId = req.query.tran_id || Object.keys(req.query)[0];
    if (!tranId) {
      return res.status(400).send("Invalid transaction");
    }

    // 🛡 Sanitize
    const sanitizedTranId = sanitize(tranId.toString());

    // 🔄 Update Payment & Booking
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: sanitizedTranId },
      { status: PaymentStatus.SUCCESS },
      { new: true },
    );

    if (!payment) {
      return res.status(404).send("Payment record not found");
    }

    const booking = await BookingModel.findOneAndUpdate(
      { transactionId: sanitizedTranId },
      { bookingStatus: BookingStatus.Confirmed },
      { new: true },
    );

    if (!booking) {
      return res.status(404).send("Booking record not found");
    }

    // 🚀 Send HTML response
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Successful</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #f4f6f8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #fff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 420px; width: 100%; }
    .success { font-size: 48px; color: #16a34a; }
    h1 { margin: 16px 0; color: #111827; }
    p { color: #6b7280; margin-bottom: 20px; }
    .txn { background: #f3f4f6; padding: 10px; border-radius: 6px; font-size: 14px; margin-bottom: 24px; word-break: break-all; }
    a { display: inline-block; padding: 12px 20px; background: #16a34a; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
    a:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="card">

    <h1>Payment Successful</h1>
    <p>Your payment has been received successfully.</p>

    <a href="https://royal-place.vercel.app/dashboard/user/bookings">
      Go to My Bookings
    </a>
  </div>
</body>
</html>
  `);
  },
);

// ====================================================
// 🔹 PAYMENT FAIL REDIRECT
// GET /payments/fail
// ====================================================
const paymentFail = catchAsyncHandeller(
  async (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Payment Failed</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; background: #fef2f2; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
  .card { background: #fff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 420px; width: 100%; }
  .fail { font-size: 48px; color: #dc2626; }
  h1 { margin: 16px 0; color: #111827; }
  p { color: #6b7280; margin-bottom: 20px; }
  a { display: inline-block; padding: 12px 20px; background: #dc2626; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
  a:hover { background: #b91c1c; }
</style>
</head>
<body>
<div class="card">
  <div class="fail">❌</div>
  <h1>Payment Failed</h1>
  <p>Your payment could not be completed.</p>
  <a href="https://royal-place.vercel.app/cart">Go Back to Cart</a>
</div>
</body>
</html>
  `);
  },
);

// ====================================================
// 🔹 PAYMENT CANCEL REDIRECT
// GET /payments/cancel
// ====================================================
const paymentCancel = catchAsyncHandeller(
  async (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Payment Cancelled</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; background: #fef3c7; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
  .card { background: #fff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 420px; width: 100%; }
  .cancel { font-size: 48px; color: #f59e0b; }
  h1 { margin: 16px 0; color: #111827; }
  p { color: #6b7280; margin-bottom: 20px; }
  a { display: inline-block; padding: 12px 20px; background: #f59e0b; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
  a:hover { background: #d97706; }
</style>
</head>
<body>
<div class="card">
  <div class="cancel">⚠️</div>
  <h1>Payment Cancelled</h1>
  <p>You have cancelled the payment.</p>
  <a href="https://royal-place.vercel.app/cart">Return to Cart</a>
</div>
</body>
</html>
  `);
  },
);

// ====================================================
// 🔹 GET ALL PAYMENTS (Admin)
// GET /payments
// ====================================================
const getPayments = catchAsyncHandeller(async (req: Request, res: Response) => {
  const payments = await paymentServices.getPayments(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  });
});

// ====================================================
// 🔹 GET USER PAYMENTS
// GET /payments/my
// ====================================================
const getMyPayments = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    const payments = await paymentServices.getPaymentsByUserId(
      userId.toString(),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "My payments fetched successfully",
      data: payments,
    });
  },
);

// ====================================================
// 🔹 EXPORT CONTROLLER
// ====================================================
export const paymentController = {
  handleIPN,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getPayments,
  getMyPayments,
};
