// src/config/db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: 1433,
  database: process.env.DB_NAME || '2HTD_LearningHub',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(dbConfig);

const poolConnect = pool
  .connect()
  .then(() => {
    console.log('✅ Connected to SQL Server');
  })
  .catch((err) => {
    console.error('❌ SQL connection error:', err);
    throw err;
  });

export { sql, pool, poolConnect };

export async function getRequest() {
  await poolConnect;
  return pool.request();
}

// ===== helper cho model mới =====
export async function getPool() {
  await poolConnect;
  return pool;
}
