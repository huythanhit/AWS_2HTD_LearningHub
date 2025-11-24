// src/routes/auth.routes.js

import express from "express";
import {
  register,
  login,
  logout,
  me,
  debugToken,
  confirmEmail,
  resendConfirmCode,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/confirm-email", confirmEmail);

router.post("/resend-confirm-code", resendConfirmCode);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, me);

router.get("/debug-token", authMiddleware, debugToken);

export default router;
