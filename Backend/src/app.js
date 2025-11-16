// src/app.js
// Khởi tạo Express app, mount middlewares + routes

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

// Middlewares chung
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '2HTD LearningHub Backend' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Error handler (để cuối cùng)
app.use(errorHandler);

export default app;
