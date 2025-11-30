// src/app.js
// Khởi tạo Express app, mount middlewares + routes

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import userRoutes from "./routes/user.routes.js";  
import practiceRoutes from './routes/practice.routes.js';
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// Middlewares chung
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "2HTD LearningHub Backend" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Test / Exam routes
app.use("/api/tests", testRoutes);

// User (admin) routes  
app.use("/api", userRoutes);   

//Practice
app.use('/api/practices', practiceRoutes);

// Error handler (để cuối cùng)
app.use(errorHandler);

export default app;
