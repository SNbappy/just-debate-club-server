const admin = require('firebase-admin');

const verifyFirebaseToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(403).json({ message: "Access denied. No token provided." });

    const parts = token.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(403).json({ message: "Invalid token format." });
    }

    admin.auth().verifyIdToken(parts[1])
        .then(decodedToken => {
            req.user = decodedToken;
            next();
        })
        .catch(error => {
            console.error("Token verification error:", error);
            res.status(403).json({ message: "Invalid or expired token." });
        });
};

module.exports = verifyFirebaseToken;
