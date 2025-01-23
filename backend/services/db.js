    // backend/services/db.js

    const pool = require('../database/db'); // platform DB connection

    class DBService{
    constructor(){}
        async createDatabase(dbName) {
           try{
            const query =  `CREATE DATABASE IF NOT EXISTS ${dbName}`;
                await pool.query(query);
            }
            catch (err){
               console.log(err)
               throw err
           }
          }

        async createTable(dbName, tableName) {
           try{
                 const query =  `CREATE TABLE IF NOT EXISTS ${dbName}.${tableName} (id UUID PRIMARY KEY DEFAULT uuid())`;
                 await pool.query(query);
               }
               catch (err){
                   console.log(err)
                   throw err
               }
        }
     }
     module.exports = DBService