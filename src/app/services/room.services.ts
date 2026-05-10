import sanitize from "mongo-sanitize";
import { AppError } from "../error/appError";

import { genericQuery } from "../utils/queryUtils";
import { IRoom, RoomQuery } from "../interfaces/room.interfaces";
import RoomModel from "../mongoSchema/room.schema";
import BookingModel from "../mongoSchema/booking.schema";
import { redis } from "../config/redis";

// Helper to clear related caches
const clearRoomCache = async (roomId?: string) => {
  // Clear all rooms list caches
  const keys = await redis.keys("rooms:*");
  for (const key of keys) {
    await redis.del(key);
  }

  // Clear single room cache if roomId provided
  if (roomId) {
    await redis.del(`rooms:${JSON.stringify(roomId)}`);
  }

  console.log("🧹 Cleared related Redis caches");
};

// ================================= Create new room =================================
export const createRoom = async (roomData: IRoom) => {
  const cleanData = sanitize(roomData);

  // Check if room number exists
  const isRoomExist = await RoomModel.exists({
    roomNumber: cleanData.roomNumber,
  });
  if (isRoomExist)
    throw new AppError("Room with this number already exists!", 409);

  const newRoom = await RoomModel.create(cleanData);

  // Clear cache after creation
  await clearRoomCache();

  return newRoom;
};

// ================================= Get all active rooms =================================
export const getAllRooms = async (query: RoomQuery) => {
  console.log(query);
  const cacheKey = `rooms:${JSON.stringify(query)}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Returning rooms from Redis cache");
    return JSON.parse(cached);
  }

  const totalGuests = Number(query.adults || 0) + Number(query.children || 0);
  const filters: any = { roomStatus: "active" };
  
  if (totalGuests > 0) filters.maxOccupancy = { $gte: totalGuests };
  
  if (query.type) {
    filters.type = {
      $in: query.type.split(",").map((t) => t.trim().toLowerCase()),
    };
  }

  // 🕒 Handle Date Availability (Real Logic)
  if (query.checkInDate && query.checkOutDate) {
    const checkIn = new Date(query.checkInDate);
    const checkOut = new Date(query.checkOutDate);

    // Find all bookings that overlap with requested dates
    const overlappingBookings = await BookingModel.find({
      bookingStatus: { $in: ["CONFIRMED", "PENDING"] },
      "rooms": {
        $elemMatch: {
          $or: [
            { 
              checkInDate: { $lt: checkOut },
              checkOutDate: { $gt: checkIn }
            }
          ]
        }
      }
    }).select("rooms.roomId");

    // Extract unique room IDs that are already booked
    const bookedRoomIds = overlappingBookings.flatMap(booking => 
      booking.rooms.map(r => r.roomId.toString())
    );

    if (bookedRoomIds.length > 0) {
      filters._id = { $nin: bookedRoomIds };
    }
  }

  const result = await genericQuery({
    model: RoomModel,
    query: { ...query, filters },
    searchFields: ["title", "type"],
  });

  // Save to Redis cache 30 min
  await redis.setex(cacheKey, 1800, JSON.stringify(result));
  console.log("💾 Saved rooms to Redis cache");

  return result;
};

// ================================= Get a single room by ID =================================
export const getRoomById = async (id: string) => {
  const cleanId = sanitize(id);
  const cacheKey = `rooms:${JSON.stringify(id)}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Returning room from Redis cache");
    return JSON.parse(cached);
  }

  const room = await RoomModel.findById(cleanId);
  if (!room) throw new AppError("Room not found!", 404);

  await redis.setex(cacheKey, 1800, JSON.stringify(room));
  console.log("💾 Saved single room to Redis cache");

  return room;
};

// ================================= Update room details =================================
export const updateRoom = async (id: string, data: Partial<IRoom>) => {
  const cleanId = sanitize(id);
  const cleanData = sanitize(data);

  const updatedRoom = await RoomModel.findByIdAndUpdate(cleanId, cleanData, {
    new: true,
  });
  if (!updatedRoom)
    throw new AppError("Failed to update room. Not found!", 404);

  // Clear related cache
  await clearRoomCache(cleanId);

  return updatedRoom;
};

// ================================= Delete room =================================
export const deleteRoom = async (id: string) => {
  const cleanId = sanitize(id);

  const deleted = await RoomModel.findByIdAndDelete(cleanId);
  if (!deleted) throw new AppError("Failed to delete room. Not found!", 404);

  // Clear related cache
  await clearRoomCache(cleanId);

  return deleted;
};

export const roomService = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
