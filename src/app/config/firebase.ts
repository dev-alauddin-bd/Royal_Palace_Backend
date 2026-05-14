import admin from "firebase-admin"
import { envVariable } from "./index";

const projectId = envVariable.FIREBASE_PROJECT_ID
const clientEmail = envVariable.FIREBASE_CLIENT_EMAIL
const privateKey = envVariable.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
)

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