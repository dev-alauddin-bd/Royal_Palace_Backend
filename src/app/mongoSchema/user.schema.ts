import { Schema, model } from "mongoose";

import bcrypt from "bcryptjs";
import { IUser, UserRole } from "../interfaces/user.interfaces";

const saltRounds = 12;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firebaseUID: {
      type: String,
      required: false,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["guest", "admin", "receptionist"],
      default: UserRole.User,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: false,
    },

    // ✅ New image field with a default value
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/dyfamn6rm/image/upload/v1750533893/user-profile-avatar-free-vector_qwaldh.jpg",
    },
  },
  {
    timestamps: true,
  }
);

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const hashed = await bcrypt.hash(this.password, saltRounds);
    this.password = hashed;
    next();
  } catch (error: any) {
    next(error);
  }
});

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
