// backend/database/db.js

const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  connectionLimit: 5
});

module.exports = pool;