require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'terraloop_db',
    });

    const ensureColumn = async (table, column, definition) => {
      const [columns] = await connection.execute(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [table, column]
      );
      if (!columns.length) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      }
    };

    await ensureColumn('users', 'profile_image_url', 'MEDIUMTEXT NULL');
    await ensureColumn('listings', 'images', 'MEDIUMTEXT NULL');
    await ensureColumn('listings', 'analysis_json', 'MEDIUMTEXT NULL');
    await ensureColumn('listings', 'latitude', 'DECIMAL(10,7) NULL');
    await ensureColumn('listings', 'longitude', 'DECIMAL(10,7) NULL');

    const [imageColumn] = await connection.execute(
      'SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['listings', 'image_url']
    );
    if (!imageColumn.length) {
      throw new Error('The listings.image_url column was not found');
    }
    if (imageColumn[0].DATA_TYPE.toLowerCase() !== 'mediumtext') {
      await connection.query('ALTER TABLE listings MODIFY COLUMN image_url MEDIUMTEXT NULL');
    }

    console.log('Image columns are ready.');
  } catch (error) {
    console.error('Could not migrate image columns:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
