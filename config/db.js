/**
 * Database Config - EduHub MySQL Connection Pool (config/db.js)
 * Tích hợp kết nối MySQL Server Local & Cloud MySQL (Aiven, PlanetScale, Railway...)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Tự động kiểm tra chế độ SSL cho Aiven Cloud
const isSSL = process.env.DB_SSL === 'REQUIRED' || 
              process.env.DB_SSL === 'true' || 
              (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'));

const dbConfig = {
  host: process.env.DB_HOST || 'facebook-mini-01-developerhoangtruong-8e80.h.aivencloud.com',
  port: parseInt(process.env.DB_PORT || '27050', 10),
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: isSSL ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Tạo Connection Pool kết nối MySQL DB
const pool = mysql.createPool(dbConfig);

// Trợ giúp kiểm tra trạng thái kết nối
async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ [MySQL Database] Kết nối MySQL Database (${dbConfig.host}:${dbConfig.port}) thành công!`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`⚠️ [MySQL Database Check Failed] (${dbConfig.host}:${dbConfig.port}):`, error.message, error.code);
    return false;
  }
}

module.exports = {
  pool,
  dbConfig,
  checkConnection,
  query: async (sql, params) => {
    const [rows, fields] = await pool.query(sql, params);
    return rows;
  },
  execute: async (sql, params) => {
    const [result] = await pool.execute(sql, params);
    return result;
  }
};
