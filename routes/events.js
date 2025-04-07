const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const result = await collections.events.find().toArray();

            // Optional: Normalize date field for frontend compatibility
            const normalized = result.map(item => ({
                ...item,
                eventDate: item.eventDate || item.date || null, // prefer eventDate
            }));

            res.status(200).json(normalized);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching events', error });
        }
    });

    router.post('/', verifyFirebaseToken, async (req, res) => {
        const { title, date, description, image } = req.body;

        if (!title || !date || !description || !image) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            const newEvent = {
                title,
                eventDate: new Date(date), // ✅ Save consistently as eventDate
                description,
                image,
                user: req.user.email,
                createdAt: new Date(),
            };

            const result = await collections.events.insertOne(newEvent);
            res.status(201).json(result);
        } catch (err) {
            res.status(500).json({ message: "Failed to add event", error: err.message });
        }
    });

    return router;
};
