import dotenv from "dotenv";

dotenv.config();

export const envVariable = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
  SESSION_SECRET: process.env.SESSION_SECRET!,
  BASE_URL: process.env.BASE_URL || "http://localhost:5000",
  DOCKER_CONTAINER: process.env.DOCKER_CONTAINER === "true",
  SENTRY_DSN: process.env.SENTRY_DSN,

  // SSLCommerz Config
  SSL_STORE_ID: process.env.SSL_STORE_ID || "",
  SSL_STORE_PASS: process.env.SSL_STORE_PASS || "",
  SSL_IS_LIVE: process.env.SSL_IS_LIVE === "true",

  // Cloudinary Config
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // Redis Config
  REDIS_URL: process.env.REDIS_URL || "",

  // AamarPay Payment Config (Legacy/Optional)
  AAMARPAY_STORE_ID: process.env.AAMARPAY_STORE_ID || "",
  AAMARPAY_SIGNATURE_KEY: process.env.AAMARPAY_SIGNATURE_KEY || "",

  // Payment URLs (Derived from BASE_URL if not provided)
  SUCCESS_URL: process.env.SUCCESS_URL || `${process.env.BASE_URL}/api/payments/success`,
  FAIL_URL: process.env.FAIL_URL || `${process.env.BASE_URL}/api/payments/fail`,
  CANCEL_URL: process.env.CANCEL_URL || `${process.env.BASE_URL}/api/payments/cancel`,

  // JWT Secrets and Expiry
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET!,
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET!,

  // ✅ These should be explicitly typed to satisfy `jsonwebtoken`
  JWT_ACCESS_TOKEN_EXPIRES_IN: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ||
    "15m") as `${number}${"s" | "m" | "h" | "d"}`,
  JWT_REFRESH_TOKEN_EXPIRES_IN: (process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ||
    "7d") as `${number}${"s" | "m" | "h" | "d"}`,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,

  // Firebase Config
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};
