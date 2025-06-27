const express = require('express');
const { ObjectId } = require('mongodb');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // POST: Add a new alumni (Protected)
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
                user: req.user.email, // Track creator
                createdAt: new Date(),
            };

            const result = await collections.alumni.insertOne(newAlumni);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: "Failed to add alumni", error: error.message });
        }
    });

    // GET: Retrieve all alumni
    router.get('/', async (req, res) => {
        try {
            const alumniList = await collections.alumni.find().sort({ createdAt: -1 }).toArray();
            res.status(200).json(alumniList);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch alumni", error: error.message });
        }
    });

    // GET: Retrieve a specific alumni by ID (for updating)
    router.get('/:id', async (req, res) => {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid alumni ID" });
        }

        try {
            const alumni = await collections.alumni.findOne({ _id: new ObjectId(id) });

            if (!alumni) {
                return res.status(404).json({ message: "Alumni not found" });
            }

            res.status(200).json(alumni);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch alumni", error: error.message });
        }
    });

    // PUT: Update an alumni (Protected - only creator can update)
    router.put('/:id', verifyFirebaseToken, async (req, res) => {
        const { id } = req.params;
        const { name, batch, position, photo, bio } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid alumni ID" });
        }

        if (!name || !batch || !position || !photo || !bio) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            const existingAlumni = await collections.alumni.findOne({ _id: new ObjectId(id) });

            if (!existingAlumni) {
                return res.status(404).json({ message: "Alumni not found" });
            }

            // Check if the current user is the creator
            if (existingAlumni.user !== req.user.email) {
                return res.status(403).json({ message: "You are not authorized to update this alumni" });
            }

            // Update alumni details
            const updatedAlumni = {
                name,
                batch,
                position,
                photo,
                bio,
                updatedAt: new Date(),
            };

            const result = await collections.alumni.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedAlumni }
            );

            if (result.modifiedCount === 0) {
                return res.status(400).json({ message: "Failed to update alumni" });
            }

            res.status(200).json({ message: "Alumni updated successfully" });
        } catch (error) {
            res.status(500).json({ message: "Failed to update alumni", error: error.message });
        }
    });

    // DELETE: Delete an alumni (Protected - only creator can delete)
    router.delete('/:id', verifyFirebaseToken, async (req, res) => {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid alumni ID" });
        }

        try {
            const result = await collections.alumni.deleteOne({
                _id: new ObjectId(id),
                user: req.user.email // Only creator can delete
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Alumni not found or not authorized" });
            }

            res.status(200).json({ message: "Alumni deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Failed to delete alumni", error: error.message });
        }
    });

    return router;
};
