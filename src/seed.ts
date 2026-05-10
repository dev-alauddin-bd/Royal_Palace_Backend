import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "./app/mongoSchema/user.schema";
import RoomModel from "./app/mongoSchema/room.schema";
import teamModel from "./app/mongoSchema/team.schema";
import GalleryModel from "./app/mongoSchema/gallery.schema";
import testimonialModel from "./app/mongoSchema/testimonials.schema";
import { UserRole } from "./app/interfaces/user.interfaces";
import { BedType, RoomStatus, RoomType } from "./app/interfaces/room.interfaces";
import { logger } from "./app/utils/logger/index";
import { envVariable } from "./app/config/index";
import path from "path";

export const seedHotel = async (force: boolean = false) => {
  try {
    // Check if seeding is already done
    if (!force) {
      const adminExists = await UserModel.findOne({ role: UserRole.Admin });
      if (adminExists) {
        logger.info("ℹ️ Database already seeded. Skipping...");
        return;
      }
    }

    logger.info("🌱 Seeding database...");

    if (force) {
      await UserModel.deleteMany({});
      await RoomModel.deleteMany({});
      await teamModel.deleteMany({});
      await GalleryModel.deleteMany({});
      await testimonialModel.deleteMany({});
      logger.info("🧹 Existing data cleared (Force Seed)");
    }

    // 1. Seed Admin & Other Users
    await UserModel.create({
      name: "Admin User",
      email: "admin@royalpalace.com",
      password: "admin123",
      role: UserRole.Admin,
      phone: "+1234567890",
      image: "https://res.cloudinary.com/dyfamn6rm/image/upload/v1750533893/user-profile-avatar-free-vector_qwaldh.jpg",
    });
    logger.info("✅ Admin user seeded");

    await UserModel.create({
      name: "Receptionist One",
      email: "reception@royalpalace.com",
      password: "reception123",
      role: UserRole.Receptionist,
      phone: "+1987654321",
    });
    logger.info("✅ Receptionist user seeded");

    // 2. Seed Rooms
    const rooms = [
        {
          roomNumber: "101",
          floor: 1,
          title: "Luxury Ocean View Suite",
          description: "Experience ultimate luxury with a breathtaking view of the ocean. This suite features premium amenities and a private balcony.",
          type: RoomType.Luxury,
          price: 250,
          adults: 2,
          children: 1,
          bedType: BedType.King,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1000"],
          features: ["Ocean View", "Private Balcony", "Mini Bar", "Free Wi-Fi"]
        },
        {
          roomNumber: "102",
          floor: 1,
          title: "Executive Business Suite",
          description: "Perfect for business travelers, this suite offers a dedicated workspace and high-speed internet.",
          type: RoomType.Suite,
          price: 180,
          adults: 2,
          children: 0,
          bedType: BedType.Queen,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1000"],
          features: ["Workspace", "High-speed Wi-Fi", "Coffee Maker"]
        },
        {
          roomNumber: "103",
          floor: 1,
          title: "Honeymoon Special Suite",
          description: "Celebrate your love in our specially designed honeymoon suite with romantic decor.",
          type: RoomType.Luxury,
          price: 300,
          adults: 2,
          children: 0,
          bedType: BedType.King,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000"],
          features: ["Jacuzzi", "Romantic Decor", "Champagne on Arrival"]
        },
        {
          roomNumber: "201",
          floor: 2,
          title: "Deluxe Family Room",
          description: "Spacious room designed for families, featuring two double beds.",
          type: RoomType.Deluxe,
          price: 150,
          adults: 2,
          children: 2,
          bedType: BedType.Double,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=1000"],
          features: ["Extra Beds Available", "TV", "Air Conditioning"]
        },
        {
          roomNumber: "202",
          floor: 2,
          title: "Standard Twin Room",
          description: "Comfortable and affordable room with two single beds.",
          type: RoomType.Twin,
          price: 100,
          adults: 2,
          children: 0,
          bedType: BedType.Twin,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&q=80&w=1000"],
          features: ["Free Wi-Fi", "Desk", "Shower"]
        },
        {
          roomNumber: "203",
          floor: 2,
          title: "Presidential Royal Suite",
          description: "The pinnacle of luxury. Our largest suite with multiple rooms and butler service.",
          type: RoomType.Luxury,
          price: 800,
          adults: 4,
          children: 2,
          bedType: BedType.King,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&q=80&w=1000"],
          features: ["Butler Service", "Private Terrace", "Luxury Toiletries"]
        },
        {
          roomNumber: "301",
          floor: 3,
          title: "Panoramic Deluxe Room",
          description: "A beautiful deluxe room on the higher floors offering a panoramic city view.",
          type: RoomType.Deluxe,
          price: 170,
          adults: 2,
          children: 1,
          bedType: BedType.Queen,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000"],
          features: ["City View", "Smart TV", "Mini Fridge"]
        },
        {
          roomNumber: "302",
          floor: 3,
          title: "Superior Garden View",
          description: "Enjoy the serenity of our landscaped gardens from this superior room.",
          type: RoomType.Deluxe,
          price: 140,
          adults: 2,
          children: 0,
          bedType: BedType.Queen,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1000"],
          features: ["Garden View", "Coffee Table", "Plush Robes"]
        },
        {
          roomNumber: "303",
          floor: 3,
          title: "Studio Suite",
          description: "A modern studio apartment style suite with a small kitchenette.",
          type: RoomType.Suite,
          price: 210,
          adults: 2,
          children: 1,
          bedType: BedType.King,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000"],
          features: ["Kitchenette", "Modern Decor", "Washing Machine"]
        },
        {
          roomNumber: "304",
          floor: 3,
          title: "Cozy Single Room",
          description: "Perfect for solo travelers, offering all essential comforts in a compact space.",
          type: RoomType.Twin,
          price: 90,
          adults: 1,
          children: 0,
          bedType: BedType.Single,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=1000"],
          features: ["Compact", "High-speed Wi-Fi", "Desk"]
        },
        {
          roomNumber: "305",
          floor: 3,
          title: "Classic Deluxe",
          description: "Timeless elegance with modern amenities.",
          type: RoomType.Deluxe,
          price: 130,
          adults: 2,
          children: 0,
          bedType: BedType.Double,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1000"],
          features: ["Classic Style", "Safe", "Mini Bar"]
        },
        {
          roomNumber: "401",
          floor: 4,
          title: "Royal Penthouse Suite",
          description: "Exquisite penthouse with panoramic views and premium facilities.",
          type: RoomType.Luxury,
          price: 950,
          adults: 4,
          children: 2,
          bedType: BedType.King,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"],
          features: ["Penthouse", "360 View", "Private Lift"]
        },
        {
          roomNumber: "402",
          floor: 4,
          title: "Skyline Suite",
          description: "Stay among the clouds in our beautiful skyline suite.",
          type: RoomType.Suite,
          price: 240,
          adults: 2,
          children: 0,
          bedType: BedType.King,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1000"],
          features: ["Floor-to-ceiling Windows", "Skyline View", "Smart Home Tech"]
        },
        {
          roomNumber: "403",
          floor: 4,
          title: "Urban Deluxe",
          description: "Modern urban design for the contemporary traveler.",
          type: RoomType.Deluxe,
          price: 160,
          adults: 2,
          children: 1,
          bedType: BedType.Queen,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80&w=1000"],
          features: ["Urban Design", "Bluetooth Speakers", "Work Desk"]
        },
        {
          roomNumber: "404",
          floor: 4,
          title: "Family Connect Room",
          description: "Two interconnected rooms perfect for large families.",
          type: RoomType.Deluxe,
          price: 280,
          adults: 4,
          children: 2,
          bedType: BedType.Double,
          bedCount: 3,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1592229529377-1e0310705f4e?auto=format&fit=crop&q=80&w=1000"],
          features: ["Interconnected", "Multiple TVs", "Kids Zone"]
        },
        {
          roomNumber: "405",
          floor: 4,
          title: "Peaceful Retreat",
          description: "A quiet room located away from the elevators for a peaceful stay.",
          type: RoomType.Twin,
          price: 110,
          adults: 2,
          children: 0,
          bedType: BedType.Twin,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&q=80&w=1000"],
          features: ["Extra Soundproofing", "Reading Nook", "Tea Set"]
        },
        {
          roomNumber: "501",
          floor: 5,
          title: "Master Luxury Suite",
          description: "Grand suite with a master bedroom and a guest room.",
          type: RoomType.Luxury,
          price: 450,
          adults: 3,
          children: 1,
          bedType: BedType.King,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000"],
          features: ["Master Bedroom", "Guest Room", "Walk-in Closet"]
        },
        {
          roomNumber: "502",
          floor: 5,
          title: "Zen Garden Suite",
          description: "Infused with Zen design principles for ultimate relaxation.",
          type: RoomType.Suite,
          price: 260,
          adults: 2,
          children: 0,
          bedType: BedType.Queen,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1000"],
          features: ["Zen Garden", "Yoga Mat", "Essential Oil Diffuser"]
        },
        {
          roomNumber: "503",
          floor: 5,
          title: "Artistic Deluxe",
          description: "Featuring local artwork and a unique aesthetic.",
          type: RoomType.Deluxe,
          price: 155,
          adults: 2,
          children: 0,
          bedType: BedType.Double,
          bedCount: 1,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000"],
          features: ["Local Art", "Designer Furniture", "Library Access"]
        },
        {
          roomNumber: "504",
          floor: 5,
          title: "Budget Twin",
          description: "Affordable twin room on the top floor.",
          type: RoomType.Twin,
          price: 95,
          adults: 2,
          children: 0,
          bedType: BedType.Twin,
          bedCount: 2,
          roomStatus: RoomStatus.Active,
          images: ["https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=1000"],
          features: ["Essential Amenities", "Window View", "Free Wi-Fi"]
        }
      ];
      await RoomModel.insertMany(rooms);
      logger.info("✅ Rooms seeded");

    // 3. Seed Team Members
    const team = [
        {
          name: "John Smith",
          role: "General Manager",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
        },
        {
          name: "Sarah Johnson",
          role: "Head of Housekeeping",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
        },
        {
          name: "Michael Chen",
          role: "Executive Chef",
          image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400"
        }
      ];
      await teamModel.insertMany(team);
      logger.info("✅ Team members seeded");

    // 4. Seed Gallery
    const gallery = [
        {
          title: "Lobby",
          image: "https://images.unsplash.com/photo-1521783988139-89397d761dce?auto=format&fit=crop&q=80&w=1000",
          description: "Our grand and welcoming lobby."
        },
        {
          title: "Swimming Pool",
          image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1000",
          description: "Relax by our crystal clear swimming pool."
        },
        {
          title: "Restaurant",
          image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000",
          description: "Fine dining at its best."
        }
      ];
      await GalleryModel.insertMany(gallery);
      logger.info("✅ Gallery seeded");

    // 5. Seed Testimonials
    // Find a guest user or create one
    const guest = await UserModel.create({
      name: "Happy Guest",
      email: "guest@example.com",
      password: "guest123",
      role: UserRole.User,
      image: "https://i.pravatar.cc/150?u=guest@example.com"
    });

    const testimonials = [
        {
          userId: guest._id,
          userName: guest.name,
          userImage: guest.image,
          roomId: "101",
          rating: 5,
          reviewText: "An amazing stay! The ocean view was stunning and the service was top-notch.",
          reviewDate: new Date().toISOString()
        },
        {
          userId: guest._id,
          userName: guest.name,
          userImage: guest.image,
          roomId: "102",
          rating: 4,
          reviewText: "Great for business. Very quiet and the Wi-Fi was fast.",
          reviewDate: new Date().toISOString()
        }
      ];
      await testimonialModel.insertMany(testimonials);
      logger.info("✅ Testimonials seeded");

    logger.info("✨ Database seeding completed successfully");
  } catch (error) {
    logger.error("❌ Error seeding database:", error);
  }
};
// Standalone execution
if (require.main === module) {
  const runStandaloneSeed = async () => {
    try {
      await mongoose.connect(envVariable.MONGO_URI as string);
      logger.info("🛢 Database connected for seeding");
      await seedHotel(true);
      await mongoose.disconnect();
      logger.info("👋 Disconnected from database");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Standalone seeding failed:", error);
      process.exit(1);
    }
  };
  runStandaloneSeed();
}
