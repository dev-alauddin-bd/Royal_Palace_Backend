import express, { Router } from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { dashboardController } from "../controllers/dashboard.controllers";

const router = express.Router();

// ✅ Only one dashboard route (role-based)
router.get(
  "/admin",
  authenticateUser,
  authorizeRoles("admin"),
  dashboardController.getAdminDashboard
);
router.get(
  "/receptionist",
  authenticateUser,
  authorizeRoles("receptionist"),
  dashboardController.getReceptionistDashboard
);
router.get(
  "/guest",
  authenticateUser,
  authorizeRoles("guest"),
  dashboardController.getGuestDashboard
);

export const dashboardRoute = router;
