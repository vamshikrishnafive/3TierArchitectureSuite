/**
 * Database Initialization Script for 3-Tier Architecture
 * Creates 'arch_auth_db' and 'arch_core_db' with all schemas and seed data.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../auth-backend/.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'root',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

async function initializeDatabases() {
  console.log('========================================================');
  console.log('🚀 Initializing MySQL Databases for 3-Tier Architecture');
  console.log(`Connecting to MySQL host: ${DB_CONFIG.host}:${DB_CONFIG.port} as '${DB_CONFIG.user}'...`);
  console.log('========================================================\n');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      port: DB_CONFIG.port,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server successfully.');

    // 1. Initialize Authentication Database (arch_auth_db)
    console.log('\n📦 Setting up [arch_auth_db] for Auth Tier...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`arch_auth_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`arch_auth_db\`;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`full_name\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`last_login\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`token\` TEXT NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`is_revoked\` BOOLEAN DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Demo User in Auth DB
    const demoPasswordHash = await bcrypt.hash('Password123!', 10);
    await connection.query(`
      INSERT INTO \`users\` (\`username\`, \`email\`, \`password_hash\`, \`full_name\`)
      VALUES ('demo_user', 'demo@example.com', '${demoPasswordHash}', 'Demo Architect')
      ON DUPLICATE KEY UPDATE \`password_hash\` = VALUES(\`password_hash\`);
    `);
    console.log('✅ [arch_auth_db] tables created & demo user verified.');

    // 2. Initialize Core Database (arch_core_db)
    console.log('\n📦 Setting up [arch_core_db] for Core Backend Tier...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`arch_core_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`arch_core_db\`;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`user_profiles\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL UNIQUE,
        \`department\` VARCHAR(100) DEFAULT 'Engineering',
        \`role_title\` VARCHAR(100) DEFAULT 'Full-Stack Architect',
        \`bio\` TEXT,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`dashboard_metrics\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL UNIQUE,
        \`api_calls_count\` INT DEFAULT 1,
        \`projects_active\` INT DEFAULT 4,
        \`tier_status\` VARCHAR(50) DEFAULT 'Tier-3 Decoupled',
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`activities\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`action_type\` VARCHAR(80) NOT NULL,
        \`description\` VARCHAR(255) NOT NULL,
        \`tier_origin\` VARCHAR(50) DEFAULT 'Core Backend (Port 5002)',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Core Data for Demo User (ID 1)
    await connection.query(`
      INSERT INTO \`user_profiles\` (\`user_id\`, \`department\`, \`role_title\`, \`bio\`)
      VALUES (1, 'Cloud Architecture', 'Lead Solutions Architect', 'Exploring decoupled 3-tier architectures with independent Auth and Core data layers.')
      ON DUPLICATE KEY UPDATE \`role_title\` = VALUES(\`role_title\`);
    `);

    await connection.query(`
      INSERT INTO \`dashboard_metrics\` (\`user_id\`, \`api_calls_count\`, \`projects_active\`, \`tier_status\`)
      VALUES (1, 12, 5, 'Verified Active')
      ON DUPLICATE KEY UPDATE \`api_calls_count\` = \`api_calls_count\` + 1;
    `);

    await connection.query(`
      INSERT INTO \`activities\` (\`user_id\`, \`action_type\`, \`description\`, \`tier_origin\`)
      VALUES 
        (1, 'DATABASE_PROVISIONED', 'Isolated arch_core_db provisioned on MySQL.', 'Core Backend (Port 5002)'),
        (1, 'TIER_SYNC', 'Initial cross-service JWT verification handshake confirmed.', 'Core Backend (Port 5002)')
      ON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);
    `);

    console.log('✅ [arch_core_db] tables created & initial metrics seeded.');
    console.log('\n========================================================');
    console.log('🎉 All databases initialized successfully!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabases();
