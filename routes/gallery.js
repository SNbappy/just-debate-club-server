const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const galleryItems = await collections.gallery.find().toArray();
            res.status(200).json(galleryItems);
        } catch (err) {
            console.error("Error fetching gallery items:", err);
            res.status(500).json({ message: "Failed to fetch gallery items" });
        }
    });

    router.post('/', verifyFirebaseToken, async (req, res) => {
        const { title, caption, image } = req.body;

        if (!title || !caption || !image) {
            return res.status(400).json({ message: "All fields are required." });
        }

        try {
            const result = await collections.gallery.insertOne({
                title,
                caption,
                image,
                createdAt: new Date(),
            });

            if (result.acknowledged) {
                res.status(201).json({
                    message: "Gallery item added successfully",
                    galleryItem: { _id: result.insertedId, title, caption, image }
                });
            } else {
                res.status(500).json({ message: "Failed to add gallery item" });
            }
        } catch (err) {
            console.error("Error adding gallery item:", err);
            res.status(500).json({ message: "Failed to add gallery item" });
        }
    });

    return router;
};
