import { Request, Response } from "express";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import { testimonialServices } from "../services/testimonial.services";
import sendResponse from "../utils/handeller/sendResponse";

// ==============================================Create a new testimonial==========================================
const testimonialCreate = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const body = req.body;
    const result = await testimonialServices.testimonialCreate(body);
    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Testimonial created successfully",
      data: result,
    });
  }
);

//====================================================== Get all testimonials===============================================
const findAllTestimonials = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const result = await testimonialServices.findAllTestimonial(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Testimonials fetched successfully",
      data: result,
    });
  }
);

//========================================================== Get testimonials by roomId===========================================
const findTestimonialsByRoomId = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await testimonialServices.findTestimonialByRoomId(id as string);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Testimonials for Room ID: ${id} fetched successfully`,
      data: result,
    });
  }
);

//========================================================== Delete testimonial by ID ===========================================
const deleteTestimonialById = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await testimonialServices.deleteTestimonialById(id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Testimonial deleted successfully",
      data: result,
    });
  }
);

// ==================================================export controller==============================================================
export const testimonialController = {
  testimonialCreate,
  findAllTestimonials,
  findTestimonialsByRoomId,
  deleteTestimonialById,
};
