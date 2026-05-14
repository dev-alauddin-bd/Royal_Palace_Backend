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
// 🔹 SHARED ROYAL STYLES
// ====================================================
const royalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Krona+One&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap');
  
  :root {
    --gold: #c5a021;
    --gold-light: #e6be8a;
    --obsidian: #0a0d12;
    --white: #fdfdfb;
  }

  body { 
    font-family: 'Noto Serif', serif; 
    background-color: var(--obsidian); 
    color: var(--white);
    display: flex; 
    align-items: center; 
    justify-content: center; 
    min-height: 100vh; 
    margin: 0; 
    overflow: hidden;
  }

  .glass-panel { 
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(197, 160, 33, 0.1);
    padding: 60px 40px; 
    text-align: center; 
    max-width: 500px; 
    width: 90%;
    position: relative;
    animation: fadeIn 0.8s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .crown-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 24px;
    color: var(--gold);
    filter: drop-shadow(0 0 10px rgba(197, 160, 33, 0.3));
  }

  h1 { 
    font-family: 'Krona One', sans-serif;
    font-size: 24px; 
    margin: 0 0 16px; 
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .status-message {
    font-size: 16px;
    color: rgba(253, 253, 251, 0.6);
    margin-bottom: 32px;
    font-weight: 300;
  }

  .details-box {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    margin-bottom: 32px;
    text-align: left;
    border-left: 2px solid var(--gold);
  }

  .details-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .details-label { color: rgba(253, 253, 251, 0.4); }
  .details-value { color: var(--gold-light); font-weight: bold; }

  .royal-button {
    display: inline-block;
    padding: 16px 32px;
    background: var(--gold);
    color: var(--obsidian);
    text-decoration: none;
    font-family: 'Krona One', sans-serif;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.3s ease;
    border: 1px solid var(--gold);
  }

  .royal-button:hover {
    background: transparent;
    color: var(--gold);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(197, 160, 33, 0.2);
  }

  .bg-glow {
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(197, 160, 33, 0.1) 0%, transparent 70%);
    z-index: -1;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

// ====================================================
// 🔹 SSLCommerz IPN (FINAL AUTHORITY)
// ====================================================
const handleIPN = catchAsyncHandeller(async (req: Request, res: Response) => {
  await paymentServices.handleIPN(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "IPN handled successfully",
    data: null,
  });
});

// ====================================================
// 🔹 PAYMENT SUCCESS REDIRECT
// ====================================================
export const paymentSuccess = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const tranId = req.body?.tran_id || req.query?.tran_id || Object.keys(req.query)[0];
    if (!tranId) return res.status(400).send("Invalid transaction");

    const sanitizedTranId = sanitize(tranId.toString());

    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: sanitizedTranId },
      { status: PaymentStatus.SUCCESS },
      { new: true },
    );

    const booking = await BookingModel.findOneAndUpdate(
      { transactionId: sanitizedTranId },
      { bookingStatus: BookingStatus.Confirmed },
      { new: true },
    );

    if (!payment || !booking) return res.status(404).send("Records not found");

    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Successful | Royal Palace</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${royalStyles}</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="glass-panel">
    <svg class="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
    </svg>
    <h1>Payment Successful</h1>
    <p class="status-message">Your stay has been successfully reserved in our royal chronicles.</p>
    
    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Transaction ID</span>
        <span class="details-value">${sanitizedTranId}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Status</span>
        <span class="details-value">Confirmed</span>
      </div>
      <div class="details-row">
        <span class="details-label">Amount</span>
        <span class="details-value">$${booking.totalAmount}</span>
      </div>
    </div>

    <a href="https://royal-palace-ten.vercel.app/dashboard/user/bookings" class="royal-button">
      Go to My Bookings
    </a>
  </div>
</body>
</html>
    `);
  }
);

// ====================================================
// 🔹 PAYMENT FAIL REDIRECT
// ====================================================
const paymentFail = catchAsyncHandeller(async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Failed | Royal Palace</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    ${royalStyles}
    .crown-icon { color: #dc2626; }
    .royal-button { background: #dc2626; border-color: #dc2626; color: white; }
    .royal-button:hover { color: #dc2626; }
    .details-box { border-left-color: #dc2626; }
  </style>
</head>
<body>
  <div class="glass-panel">
    <svg class="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <h1>Payment Failed</h1>
    <p class="status-message">We were unable to verify your royal tribute. Please attempt the transaction again.</p>
    <a href="https://royal-palace-ten.vercel.app/cart" class="royal-button">Return to Cart</a>
  </div>
</body>
</html>
  `);
});

// ====================================================
// 🔹 PAYMENT CANCEL REDIRECT
// ====================================================
const paymentCancel = catchAsyncHandeller(async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Cancelled | Royal Palace</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    ${royalStyles}
    .crown-icon { color: #f59e0b; }
    .royal-button { background: #f59e0b; border-color: #f59e0b; color: var(--obsidian); }
    .royal-button:hover { color: #f59e0b; }
    .details-box { border-left-color: #f59e0b; }
  </style>
</head>
<body>
  <div class="glass-panel">
    <svg class="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    <h1>Payment Cancelled</h1>
    <p class="status-message">The royal registry has noted your cancellation. You may return to review your choices.</p>
    <a href="https://royal-palace-ten.vercel.app/cart" class="royal-button">Return to Cart</a>
  </div>
</body>
</html>
  `);
});

// ====================================================
// 🔹 GET ALL PAYMENTS (Admin)
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
// ====================================================
const getMyPayments = catchAsyncHandeller(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const payments = await paymentServices.getPaymentsByUserId(userId.toString());
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My payments fetched successfully",
    data: payments,
  });
});

export const paymentController = {
  handleIPN,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getPayments,
  getMyPayments,
};
