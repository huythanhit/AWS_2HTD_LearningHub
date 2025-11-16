import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '2HTD LearningHub Backend' });
});

// routes
app.use('/api/auth', authRoutes);

// error handler
app.use(errorHandler);

export default app;
