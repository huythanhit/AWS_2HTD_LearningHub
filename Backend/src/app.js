// src/app.js
// Khởi tạo Express app, mount middlewares + routes

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import userRoutes from "./routes/user.routes.js";  
import practiceRoutes from './routes/practice.routes.js';
import courseRoutes from "./routes/course.routes.js";
import notificationRoutes from './routes/notification.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// CORS configuration - cho phép cả local và production domains
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, Lambda, etc.)
    if (!origin) return callback(null, true);
    
    // Collect allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://2htdlearninghub.xyz',
      'https://www.2htdlearninghub.xyz',
      // Vercel preview URLs pattern
      /^https:\/\/.*\.vercel\.app$/,
      // Local development pattern
      /^http:\/\/localhost:\d+$/,
    ].filter(Boolean);

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check pattern match (for regex)
    const matchesPattern = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return false;
    });

    if (matchesPattern) {
      return callback(null, true);
    }

    // Cho phép tất cả trong development, strict trong production
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middlewares chung
app.use(cors(corsOptions));
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

//Course
app.use("/api", courseRoutes);

//Notification
app.use('/api/notifications', notificationRoutes);

//Upload
app.use('/api/upload', uploadRoutes);

// Error handler (để cuối cùng)
app.use(errorHandler);

export default app;
