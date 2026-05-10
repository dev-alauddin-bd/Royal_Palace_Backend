import { Router } from "express";
import { userController } from "../controllers/user.controllers";
import upload from "../middleware/uploadMiddleware";

const router = Router();


/* ================= ROUTES ================= */
router.post("/signup", userController.regestrationUser);
router.post("/login", userController.loginUser);
router.post("/refresh-token", userController.refreshAccessToken);
router.get("/", userController.getAllUsers);

router.get("/singleUser", userController.getSingleUser);

router.patch("/:id", upload.single("image"), userController.updateUser);
router.delete("/:id", userController.deleteUser);

export const userRoute = router;
