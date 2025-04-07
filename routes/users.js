const express = require('express');

module.exports = (collections) => {
    const router = express.Router();

    router.post('/', async (req, res) => {
        try {
            const user = req.body;
            const result = await collections.users.insertOne(user);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: "Failed to add user", error });
        }
    });

    return router;
};
