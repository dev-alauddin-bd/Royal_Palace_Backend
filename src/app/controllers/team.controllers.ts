import { Request, Response } from "express";
import sanitize from "mongo-sanitize";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { teamServices } from "../services/team.services";
import sendResponse from "../utils/handeller/sendResponse";

const createTeamMember = catchAsyncHandeller(async (req: Request, res: Response) => {
  const imageUrl = req.file?.path;
  const payload = sanitize({ ...req.body, image: imageUrl });
  
  const result = await teamServices.createTeamMember(payload);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Team member created successfully",
    data: result,
  });
});

const getAllTeamMembers = catchAsyncHandeller(async (req: Request, res: Response) => {
  const result = await teamServices.getAllTeamMembers(req.query);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Team members fetched successfully",
    data: result,
  });
});

const updateTeamMember = catchAsyncHandeller(async (req: Request, res: Response) => {
  const { id } = sanitize(req.params);
  let updatedData;
  const imageUrl = req.file?.path;
  
  if (imageUrl) {
    updatedData = sanitize({ ...req.body, image: imageUrl });
  } else {
    updatedData = sanitize(req.body);
  }

  const result = await teamServices.updateTeamMember(id as string, updatedData);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Team member updated successfully",
    data: result,
  });
});

const deleteTeamMember = catchAsyncHandeller(async (req: Request, res: Response) => {
  const { id } = sanitize(req.params);
  await teamServices.deleteTeamMember(id as string);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Team member deleted successfully",
    data: null,
  });
});

export const teamControllers = {
  createTeamMember,
  getAllTeamMembers,
  updateTeamMember,
  deleteTeamMember,
};
