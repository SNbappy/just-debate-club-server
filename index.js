const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const admin = require('firebase-admin');
const { generateJWT } = require('./auth');
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

// MongoDB Setup
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cdpi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Firebase Token Verification Middleware
const verifyFirebaseToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log("Received Token:", token);  // Debugging line

    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(403).json({ message: "Invalid token format." });
    }

    // Verify Firebase ID Token
    admin.auth().verifyIdToken(tokenParts[1])
        .then((decodedToken) => {
            req.user = decodedToken;
            next();  // Allow request to continue
        })
        .catch((error) => {
            console.error("Token verification error:", error);
            return res.status(403).json({ message: "Invalid or expired token." });
        });
};

// Connect to MongoDB once and keep the connection open
async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("JUSTDC");
        const userCollection = db.collection("users");
        const eventsCollection = db.collection("events");
        const galleryCollection = db.collection("gallery");
        const membersCollection = db.collection("members");
        const alumniCollection = db.collection("alumni");

        //Users Related API
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const result = await userCollection.insertOne(user);
                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ message: "Failed to add user", error });
            }
        });

        //GET All Events (Public)
        app.get('/events', async (req, res) => {
            try {
                const result = await eventsCollection.find().toArray();
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching events', error });
            }
        });


        app.post("/events", verifyFirebaseToken, async (req, res) => {
            const { title, date, description, image } = req.body;

            if (!title || !date || !description || !image) {
                return res.status(400).json({ message: "All fields are required" });
            }

            try {
                const newEvent = {
                    title,
                    date,
                    description,
                    image,
                    user: req.user.email,
                    createdAt: new Date(),
                };

                const result = await eventsCollection.insertOne(newEvent);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: "Failed to add event", error: err.message });
            }
        });








        // gallery Portion
        app.post('/gallery', verifyFirebaseToken, async (req, res) => {
            const { title, caption, image } = req.body;

            if (!title || !caption || !image) {
                return res.status(400).json({ message: "All fields are required." });
            }

            try {
                // Insert gallery item into MongoDB
                const result = await galleryCollection.insertOne({
                    title,
                    caption,
                    image,
                    createdAt: new Date(),
                });

                // Check if insertion was successful
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


        // GET Route to Fetch All Gallery Items
        app.get('/gallery', async (req, res) => {
            try {
                const galleryItems = await galleryCollection.find().toArray();
                res.status(200).json(galleryItems);
            } catch (err) {
                console.error("Error fetching gallery items:", err);
                res.status(500).json({ message: "Failed to fetch gallery items" });
            }
        });






        // Alumni Portion






        //POST Login (Firebase Token to JWT)
        app.post('/login', async (req, res) => {
            const idToken = req.body.idToken;  // Firebase ID token sent from the client

            try {
                // Verify Firebase ID Token
                const decodedToken = await admin.auth().verifyIdToken(idToken);

                // Generate JWT for the user
                const userJWT = generateJWT(decodedToken);

                // Send the JWT as the response
                res.status(200).json({ token: userJWT });
            } catch (error) {
                console.error("Error during token verification or JWT generation", error);
                res.status(401).json({ message: "Invalid or expired token" });
            }
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Ensure the server shuts down if MongoDB connection fails
    }
}

run().catch(console.dir);

//Root Route
app.get('/', (req, res) => {
    res.send('🚀 Server is running');
});

//Start Server
app.listen(port, () => {
    console.log(`🔷 Server is running on port ${port}`);
});

// Graceful shutdown for MongoDB connection
process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit();
});