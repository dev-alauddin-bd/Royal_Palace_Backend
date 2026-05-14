import express from "express";

import { paymentController } from "../controllers/payment.controllers";
import { authenticateUser } from "../middleware/authenticateUser";

const router = express.Router();

router.get("/my",authenticateUser, paymentController.getMyPayments);

// SSLCommerz callbacks
router.post("/ipn", paymentController.handleIPN);
router.post("/success", paymentController.paymentSuccess);
router.post("/fail", paymentController.paymentFail);
router.post("/cancel", paymentController.paymentCancel);

// Admin
router.get("/", authenticateUser, paymentController.getPayments);

export const paymentRoute = router;
