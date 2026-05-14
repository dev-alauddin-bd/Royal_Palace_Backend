import { AppError } from "../error/appError";
import { BookingStatus } from "../interfaces/booking.interfcae";
import BookingModel from "../mongoSchema/booking.schema";
import RoomModel from "../mongoSchema/room.schema";

interface RoomForCalculation {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
}

export const checkConflictedRooms = async (
  roomsForCalculation: RoomForCalculation[],
) => {
  const conflictedRoomTitles: string[] = [];

  for (const room of roomsForCalculation) {
    const overlappingBooking = await BookingModel.findOne({
      "rooms.roomId": room.roomId,
      bookingStatus: BookingStatus.Confirmed,
      "rooms.checkInDate": { $lt: room.checkOutDate },
      "rooms.checkOutDate": { $gt: room.checkInDate },
    });

    if (overlappingBooking) {
      const roomData = await RoomModel.findById(room.roomId).select("title");
      conflictedRoomTitles.push(roomData?.title || room.roomId);
    }
  }

  if (conflictedRoomTitles.length > 0) {
    throw new AppError(
      `The following rooms are already booked for the selected dates: ${conflictedRoomTitles.join(
        ", ",
      )}`,
      400,
    );
  }

  return true; // ✅ no conflict
};
