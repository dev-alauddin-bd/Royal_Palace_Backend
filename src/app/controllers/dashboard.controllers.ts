import { Request, Response } from "express";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { AppError } from "../error/appError";
import { dashboardService } from "../services/dashboard.services";
import sendResponse from "../utils/handeller/sendResponse";

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
    data: data,
  });
});

export const dashboardController = {
  getDashboardData,
};
