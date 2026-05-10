import mongoose from "mongoose";
import { ITestimonial } from "../interfaces/testimonial.interfaces";

import { BookingStatus } from "../interfaces/booking.interfcae";
import { AppError } from "../error/appError";
import testimonialModel from "../mongoSchema/testimonials.schema";
import BookingModel from "../mongoSchema/booking.schema";

//============================================== Create a new testimonial==========================================

const testimonialCreate = async (data: ITestimonial) => {
  const { userId, roomId } = data;

  const bookings = await BookingModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    bookingStatus: BookingStatus.Confirmed,
    rooms: {
      $elemMatch: {
        roomId: new mongoose.Types.ObjectId(roomId),
      },
    },
  });

  if (!bookings) {
    throw new AppError("You can only review rooms you have booked.", 403);
  }

  const testimonial = await testimonialModel.create(data);
  return testimonial;
};

//============================================== Get all testimonials sorted by newest==============================================

import { genericQuery } from "../utils/queryUtils";

const findAllTestimonial = async (query: Record<string, any>) => {
  const result = await genericQuery({
    model: testimonialModel,
    query,
    searchFields: ["comment"],
    lookup: [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
    ],
    select: "comment rating createdAt userInfo.name userInfo.avatar",
  });

  return result;
};

// ========================================Get testimonials by room ID====================================================
const findTestimonialByRoomId = async (roomId: string) => {
  const testimonials = await testimonialModel
    .find({ roomId })
    .sort({ _id: -1 });
  return testimonials;
};

// ========================================Hard delete testimonial by ID====================================================
const deleteTestimonialById = async (testimonialId: string) => {
  const result = await testimonialModel.findByIdAndDelete(testimonialId);
  if (result) throw new AppError("Testimonial not found", 404);
  return result;
};

// ===========================================Export services===================================================================
export const testimonialServices = {
  testimonialCreate,
  findAllTestimonial,
  findTestimonialByRoomId,
  deleteTestimonialById,
};
