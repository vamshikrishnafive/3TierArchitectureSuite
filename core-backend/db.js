const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'arch_core_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Core DB] Connected to MySQL database "${process.env.DB_NAME || 'arch_core_db'}" successfully.`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Core DB] Failed to connect to MySQL:`, error.message);
    return false;
  }
}

module.exports = { pool, testDbConnection };
