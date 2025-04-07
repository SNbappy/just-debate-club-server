const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // POST: Add a new alumni
    router.post('/', verifyFirebaseToken, async (req, res) => {
        const { name, batch, position, photo, bio } = req.body;

        if (!name || !batch || !position || !photo || !bio) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            const newAlumni = {
                name,
                batch,
                position,
                photo,
                bio,
                user: req.user.email,
                createdAt: new Date(),
            };

            const result = await collections.alumni.insertOne(newAlumni);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: "Failed to add alumni", error: error.message });
        }
    });

    //GET: Retrieve all alumni
    router.get('/', async (req, res) => {
        try {
            const alumniList = await collections.alumni.find().sort({ createdAt: -1 }).toArray();
            res.status(200).json(alumniList);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch alumni", error: error.message });
        }
    });

    return router;
};
