import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
  googleAuth,
  verifyToken
} from "../controllers/userController.js";

const router = Router();


router.post("/login", login);


router.post("/register", register);


router.post("/google-auth", googleAuth);


router.post("/add_to_activity", addToHistory);


router.get("/get_all_activity", getUserHistory);

router.get("/verify-token", verifyToken);

export default router;
