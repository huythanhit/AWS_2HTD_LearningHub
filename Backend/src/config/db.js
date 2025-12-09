// src/config/db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Tối ưu pool config cho Lambda
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || '2HTD_LearningHub',
  pool: {
    max: isLambda ? 5 : 10, // Giảm pool size cho Lambda để tiết kiệm memory
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000, // Timeout cho Lambda
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000, // Tăng timeout lên 60s cho Lambda VPC connection
    connectionTimeout: 60000, // Connection timeout 60s
  }
};

const pool = new sql.ConnectionPool(dbConfig);

// Lambda sẽ reuse connection pool giữa các invocations
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
