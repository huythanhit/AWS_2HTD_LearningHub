// src/config/db.js
// Cấu hình kết nối SQL Server bằng mssql

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || '2HTD_LearningHub',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,               // Khớp với "Encryption: Mandatory" trong SSMS
    trustServerCertificate: true // Khớp với "Trust server certificate"
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

// Helper tạo request mới
export async function getRequest() {
  await poolConnect;
  return pool.request();
}
