import { NextFunction, Request, Response } from "express";
import sanitize from "mongo-sanitize";
import { catchAsyncHandeller } from "../utils/handeller/catchAsyncHandeller";
import sendResponse from "../utils/handeller/sendResponse";
import jwt from "jsonwebtoken"
import admin from "../config/firebase"
import UserModel from "../mongoSchema/user.schema"
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/jwt/generateTokens";
import { cookieOptions } from "../config/cookie";
import { AppError } from "../error/appError";
import { userServices } from "../services/user.services";
import { IUser } from "../interfaces/user.interfaces";
import {
  loginValidation,
  signupValidation,
} from "../zodValidations/v1/user.validations";

// ================= Registration =====================
// 1️⃣ Catch Async Handler
const regestrationUser = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const validated = signupValidation.parse(req.body);

    const user = await userServices.registerUserIntoDb(validated as IUser);

    const accessToken = createAccessToken({ id: user._id, role: user.role });
    const refreshToken = createRefreshToken({ id: user._id, role: user.role });

    // Set tokens as HttpOnly cookies
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: {
        user,
        accessToken,
      },
    });
  }
);

// ================= Login ======================
const loginUser = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = loginValidation.parse(req.body);
    const email = sanitize(validatedData.email);
    const password = sanitize(validatedData.password);

    const user = await userServices.loginUserByEmail(email, password);

    const payload = { id: user._id, role: user.role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  }
);

//================================find single user=============================================
const getSingleUser = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = sanitize(req.query);
    const user = await userServices.getSingleUser(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  }
);

// ===================================================== find all user==========================================
const getAllUsers = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await userServices.getAllUsers(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  }
);

// =====================================================delete user=================================================
const deleteUser = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = sanitize(req.params.id);

    const deletedUser = await userServices.deleteUserById(id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  }
);

//=========================================== update user================================================================
const updateUser = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = sanitize(req.params.id);

    let updatedData;
    const imageUrl = req.file?.path;
    if (imageUrl) {
      updatedData = sanitize({ ...req.body, image: imageUrl });
    } else {
      updatedData = sanitize(req.body);
    }

    const user = await userServices.updateUserById(id as string, updatedData);
    const payload = { id: user._id, role: user.role };
    const refreshToken = createRefreshToken(payload);
    const accessToken = createAccessToken(payload);

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User updated successfully",
      data: {
        user,
        accessToken,
      },
    });
  }
);

// ======================================================refresh token ==============================================
export const refreshAccessToken = catchAsyncHandeller(
  async (req: Request, res: Response) => {
    const refreshTokenRaw =
      req.cookies?.refreshToken || req.headers["x-refresh-token"];
    const refreshToken = sanitize(refreshTokenRaw);

    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const user = await userServices.requestRefreshToken(refreshToken);

    const payload = { id: user._id, role: user.role };
    const accessToken = createAccessToken(payload);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Access token refreshed successfully",
      data: {
        user,
        accessToken,
      },
    });
  }
);

const logoutUser = catchAsyncHandeller(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("refreshToken", cookieOptions);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User logged out successfully",
      data: null,
    });
  }
);




const firebaseLogin = catchAsyncHandeller(async (req: Request, res: Response) => {
  const { idToken } = req.body
  console.log(req.body)
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "ID Token is required",
    })
  }

  // ✅ verify firebase token
  const decoded = await admin.auth().verifyIdToken(idToken)

  const email = decoded.email
  const uid = decoded.uid
  const name = decoded.name || ""
  const picture = decoded.picture || ""

  if (!email || !uid) {
    return res.status(400).json({
      success: false,
      message: "Invalid Firebase token",
    })
  }

  // ✅ find or create user
  let user = await UserModel.findOne({ email })

  if (!user) {
    user = await UserModel.create({
      email,
      firebaseUID: uid,
      name,
      avatar: picture,
      provider: "google",
    })
  }

  // optional update uid
  if (!user.firebaseUID) {
    user.firebaseUID = uid
    await user.save()
  }

  // ✅ JWT
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN! as `${number}${"s" | "m" | "h" | "d"}` }
  )

  return res.status(200).json({
    success: true,
    data: {
      user,
      accessToken,
    },
  })
})

// ======================export controller===============================================
export const userController = {
  regestrationUser,
  loginUser,
  getSingleUser,
  getAllUsers,
  deleteUser,
  updateUser,
  refreshAccessToken,
  logoutUser,
  firebaseLogin
};
