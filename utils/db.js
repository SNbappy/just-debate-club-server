const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cdpi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let _collections = {};

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("JUSTDC");

        _collections = {
            users: db.collection("users"),
            events: db.collection("events"),
            gallery: db.collection("gallery"),
            members: db.collection("members"),
            alumni: db.collection("alumni"),
        };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

function getCollections() {
    return _collections;
}

module.exports = { connectToMongo, getCollections, client };
