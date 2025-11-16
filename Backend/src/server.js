import dotenv from 'dotenv';
import app from './app.js';
import { poolConnect } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await poolConnect; 

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
