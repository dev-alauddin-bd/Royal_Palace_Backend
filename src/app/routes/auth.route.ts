import { Router } from "express";
import { userController } from "../controllers/user.controllers";

const router = Router();

router.post("/firebase", userController.firebaseLogin);

export const authRoute = router;
