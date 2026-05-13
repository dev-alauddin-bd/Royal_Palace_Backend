import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sanitize from "mongo-sanitize";

import { logger } from "../utils/logger";
import { AppError } from "../error/appError";

import { envVariable } from "../config";
import {
  IUpdateUserInput,
  IUser,
  IUserQuery,
} from "../interfaces/user.interfaces";
import UserModel from "../mongoSchema/user.schema";
import { genericQuery } from "../utils/queryUtils";



// ================================= Registration =================================
const registerUserIntoDb = async (body: IUser) => {
  const cleanBody = sanitize(body);

  const isUserExist = await UserModel.findOne({ email: cleanBody.email });
  if (isUserExist) {
    logger.warn("⚠️ Registration failed: User already exists");
    throw new AppError("User already exists!", 400);
  }

  const newUser = await UserModel.create(cleanBody);


  logger.info(`✅ New user registered: ${newUser.email}`);
  return newUser;
};

// ================================= Login user =================================
const loginUserByEmail = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email, isDeleted: false });

  if (!user) throw new AppError("User does not exist!", 404);

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new AppError("Incorrect password!", 401);

  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

// ================================= Find single user =================================
const getSingleUser = async (query: { name?: string, email?: string }) => {

  // sanitize input
  const sanitizedQuery = sanitize(query);

  // Determine search field
  let cacheKey;
  let mongoQuery;

  if (sanitizedQuery.email) {
    const email = sanitizedQuery.email.toLowerCase();
    cacheKey = `user:email:${email}`;
    mongoQuery = { email: { $regex: `^${email}$`, $options: "i" } };
  } else if (sanitizedQuery.name) {
    const name = sanitizedQuery.name.toLowerCase();
    cacheKey = `user:name:${name}`;
    mongoQuery = { name: { $regex: `^${name}$`, $options: "i" } };
  } else {
    throw new AppError("Email or name is required!", 400);
  }




  const user = await UserModel.findOne(mongoQuery).select("-password -__v -isDeleted");
  if (!user) throw new AppError("User not found!", 404);


  return user;
};
// ================================= Find all users =================================
const getAllUsers = async (query: IUserQuery) => {


  const result = await genericQuery({
    model: UserModel,
    query: { ...query },
    searchFields: ["name", "email", "phone"],
    // select: "name email phone",
  });


  return result;
};

// ================================= Delete user (soft delete) =================================
const deleteUserById = async (id: string) => {
  const cleanId = sanitize(id);

  const user = await UserModel.findById(cleanId);
  if (!user) throw new AppError("Failed to delete user. User not found!", 404);

  user.isDeleted = true;
  await user.save();


  return user;
};

// ================================= Update user =================================
const updateUserById = async (id: string, updateData: IUpdateUserInput) => {
  const cleanId = sanitize(id);
  const cleanUpdateData = sanitize(updateData);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: cleanId, isDeleted: false },
    cleanUpdateData,
    { new: true, runValidators: true }
  );

  if (!updatedUser)
    throw new AppError("User not found or has been deleted!", 404);


  return updatedUser;
};

// ================================= Refresh token =================================
interface JwtDecodedPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const requestRefreshToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      envVariable.JWT_REFRESH_TOKEN_SECRET as string
    ) as JwtDecodedPayload;

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new AppError("User not found", 404);

    return user;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw new AppError("Refresh token expired", 401);
    else if (err instanceof jwt.JsonWebTokenError)
      throw new AppError("Invalid refresh token", 401);
    throw err;
  }
};

// ================================= Firebase Login =================================
const findOrCreateFromFirebase = async ({
  firebaseUid,
  email,
  name,
  picture,
}: {
  firebaseUid: string;
  email: string;
  name: string;
  picture?: string;
}) => {
  // Try to find existing user by Firebase UID
  let user = await UserModel.findOne({ firebaseUid });

  if (!user) {
    // If not found, create a new user
    const randomPassword = Math.random().toString(36).slice(-10);
    user = await UserModel.create({
      firebaseUid,
      email,
      name,
      image: picture || undefined,
      password: randomPassword, // pre-save hook will hash it
      role: 'guest',
    });
    logger.info(`✅ New user created via Firebase: ${email}`);
  }

  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

// ============================== Export Services ==============================
export const userServices = {
  registerUserIntoDb,
  loginUserByEmail,
  getSingleUser,
  getAllUsers,
  deleteUserById,
  updateUserById,
  requestRefreshToken,
  findOrCreateFromFirebase,
};
