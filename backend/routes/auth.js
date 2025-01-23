// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
 const { PrismaClient } = require('@prisma/client')
const router = express.Router();
const prisma = new PrismaClient()

// signup route
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
         const user = await prisma.users.create({
             data: {
                email: email,
                 password: hashedPassword
                }
           })
      res.send({ message: 'User registered!', user });
    } catch (error) {
        console.error(error)
       res.status(500).send({message: "Unable to create user"})
    }

  });

router.get('/users', async (req, res) => {
    try {
         const users = await prisma.users.findMany()
        res.send({ users: users });
      } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Unable to fetch users' });
      }
});

module.exports = router;