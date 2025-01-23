// backend/routes/projects.js
const express = require('express');
const router = express.Router();
const { generateApiKey } = require('../utils/apikey');
const DBService = require('../services/db') // import DB service
const { verifyApiKey } = require('../middleware/auth') // import middleware
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create project route
router.post('/create',verifyApiKey, async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id // user info from token
    try {
        const apiKey = await generateApiKey(); // function to generate api key
        const projectId =  Math.random().toString(36).substring(2, 15); // function to generate project id, should be replaced with better alternative in production
        const dbName = `project_${projectId}` // Added backticks
        const dbService = new DBService()
        await dbService.createDatabase(dbName)
        const project = await prisma.projects.create({
            data:{
                project_id: projectId,
                name: name,
                user_id: userId,
                api_key: apiKey
            }
        })

        res.send({ message: 'Project created!', apiKey, projectId, project });

    } catch (error) {
        console.error(error)
        res.status(500).send({message: 'Unable to create project'})
    }
});

// list projects
router.get('/',verifyApiKey, async (req, res) => {
    const userId = req.user.id // user info from token
    try {
        const projects = await prisma.projects.findMany({ where: { user_id: userId} })
        res.send({ projects: projects });
    } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Unable to fetch projects' });
    }
});

module.exports = router;