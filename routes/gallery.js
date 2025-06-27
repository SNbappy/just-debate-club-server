const express = require('express');
const { ObjectId } = require('mongodb');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // GET all event galleries (only show title and cover image)
    router.get('/', async (req, res) => {
        try {
            const galleryEvents = await collections.gallery.find({}, {
                projection: { title: 1, coverImage: 1 }
            }).toArray();
            res.status(200).json(galleryEvents);
        } catch (err) {
            console.error("Error fetching gallery events:", err);
            res.status(500).json({ message: "Failed to fetch gallery events" });
        }
    });

    // GET one event gallery by ID (with all images)
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const event = await collections.gallery.findOne({ _id: new ObjectId(id) });
            if (!event) return res.status(404).json({ message: "Event not found" });
            res.status(200).json(event);
        } catch (err) {
            console.error("Error fetching event:", err);
            res.status(500).json({ message: "Failed to fetch event" });
        }
    });

    // POST a new gallery event
    router.post('/', verifyFirebaseToken, async (req, res) => {
        const { title, description, coverImage, images } = req.body;

        if (!title || !coverImage || !images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ message: "Title, cover image, and images are required." });
        }

        try {
            const result = await collections.gallery.insertOne({
                title,
                description,
                coverImage,
                images,
                createdAt: new Date()
            });
            res.status(201).json({ message: "Gallery event created", id: result.insertedId });
        } catch (err) {
            console.error("Error creating gallery event:", err);
            res.status(500).json({ message: "Failed to create gallery event" });
        }
    });

    // PUT - Add more images to an existing event
    router.put('/:id/add-images', verifyFirebaseToken, async (req, res) => {
        const { id } = req.params;
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ message: "Images are required." });
        }

        try {
            const result = await collections.gallery.updateOne(
                { _id: new ObjectId(id) },
                { $push: { images: { $each: images } } }
            );

            if (result.modifiedCount > 0) {
                res.status(200).json({ message: "Images added successfully" });
            } else {
                res.status(404).json({ message: "Event not found" });
            }
        } catch (err) {
            console.error("Error adding images:", err);
            res.status(500).json({ message: "Failed to add images" });
        }
    });

    return router;
};
