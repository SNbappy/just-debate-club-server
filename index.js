const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

const { generateJWT } = require('./auth');
const { connectToMongo, getCollections, client } = require('./utils/db');

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const galleryRoutes = require('./routes/gallery');
const alumniRoutes = require('./routes/alumni'); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin SDK Initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
} else {
    admin.app();
}

// Connect to MongoDB and start server
connectToMongo().then(() => {
    const collections = getCollections();

    app.use('/users', userRoutes(collections));
    app.use('/events', eventRoutes(collections));
    app.use('/gallery', galleryRoutes(collections));
    app.use('/alumni', alumniRoutes(collections));

    // Firebase login route
    app.post('/login', async (req, res) => {
        const idToken = req.body.idToken;
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userJWT = generateJWT(decodedToken);
            res.status(200).json({ token: userJWT });
        } catch (error) {
            console.error("Login error:", error);
            res.status(401).json({ message: "Invalid or expired token" });
        }
    });

    // Root Route
    app.get('/', (req, res) => res.send('🚀 Server is running'));

    // Start Server
    app.listen(port, () => console.log(`🔷 Server is running on port ${port}`));
}).catch(err => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit();
});
