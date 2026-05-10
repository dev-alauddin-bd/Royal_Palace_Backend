import { Router } from "express";
import { teamControllers } from "../controllers/team.controllers";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.post("/create-team", upload.single("image"), teamControllers.createTeamMember);
router.get("/", teamControllers.getAllTeamMembers);
router.patch("/:id", upload.single("image"), teamControllers.updateTeamMember);
router.delete("/:id", teamControllers.deleteTeamMember);

export const teamRoute = router;
