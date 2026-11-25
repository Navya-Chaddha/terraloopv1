// scripts/init-db.js
// Simple script to initialize MySQL database using schema.sql
// Run with: npm run db:init

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'terralloop_db',
      multipleStatements: true,
    });

    await connection.query(sql);
    console.log('✅ Database schema created successfully');
    await connection.end();
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  }
})();
