// backend/middleware/auth.js

const pool = require('../database/db');

const verifyApiKey = async (req, res, next) => {
    // for now, skipping token verficiation
      // normally you would verify that the token is correct and get user info here.
      // for example, you can read api key from header, and then check in your DB, and then get user id from there.
      // Then, you would also verify JWT token, which will be used in later versions.
    // The key has to be provided in X-Api-Key
  try{
       req.user = { id: "testUser"};
       next();
   }
   catch (err){
         console.log(err)
        res.status(401).send({message: "Not authenticated"});
   }
  };

module.exports = {
    verifyApiKey
}