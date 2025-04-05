const jwt = require('jsonwebtoken');
const admin = require('./firebase-admin'); // Import Firebase Admin

// Function to generate JWT token
const generateJWT = (user) => {
    const payload = {
        email: user.email,
        uid: user.uid
    };

    // Sign the token with the JWT secret and set an expiration time (e.g., 1 hour)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return token;
};

// Function to verify Firebase token (assuming token is passed in Authorization header)
const verifyFirebaseToken = async (token) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        throw new Error('Unauthorized');
    }
};

module.exports = {
    generateJWT,
    verifyFirebaseToken, // Export the function for use elsewhere
};
