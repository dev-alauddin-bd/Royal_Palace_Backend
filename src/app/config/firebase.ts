import admin from "firebase-admin"
import dotenv from "dotenv";
dotenv.config();
const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
)

// console.log(projectId, clientEmail, privateKey)
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase environment variables")
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export default admin