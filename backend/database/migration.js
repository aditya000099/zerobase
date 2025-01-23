// backend/database/migration.js

const pool = require('./db');
const fs = require('fs').promises;
const path = require('path');

async function applyMigrations() {
    try {
        console.log("Starting Migration..")
        const sqlFilePath = path.join(__dirname, 'migrations/init.sql');
        console.log("SQL file path", sqlFilePath)
        const sql = await fs.readFile(sqlFilePath, 'utf8');
         console.log("SQL File Content", sql)
        await pool.query(sql);
        console.log("Migration completed!");
    } catch (error) {
        console.error("Error in migration", error);
    }
}

module.exports = {
    applyMigrations
};