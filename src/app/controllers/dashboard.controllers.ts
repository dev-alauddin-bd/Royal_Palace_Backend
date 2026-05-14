import { Request, Response } from "express";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { AppError } from "../error/appError";
import { dashboardService } from "../services/dashboard.services";
import sendResponse from "../utils/handeller/sendResponse";

const getAdminDashboard = catchAsyncHandeller(async (req: Request, res: Response) => {
  const data = await dashboardService.getAdminOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard data fetched successfully",
    data,
  });
});

const getReceptionistDashboard = catchAsyncHandeller(async (req: Request, res: Response) => {
  const data = await dashboardService.getReceptionistOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receptionist dashboard data fetched successfully",
    data,
  });
});

const getGuestDashboard = catchAsyncHandeller(async (req: Request, res: Response) => {
  const data = await dashboardService.getGuestOverview(req.user?._id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guest dashboard data fetched successfully",
    data,
  });
});

const getDashboardData = catchAsyncHandeller(async (req: Request, res: Response) => {
  const role = req.user?.role;
  const userId = req.user?._id;

  if (!role) {
    throw new AppError("User role is required", 400);
  }

  const data = await dashboardService.dashboardOverviewByRole(role, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard data fetched successfully",
    data,
  });
});

export const dashboardController = {
  getAdminDashboard,
  getReceptionistDashboard,
  getGuestDashboard,
  getDashboardData,
};
