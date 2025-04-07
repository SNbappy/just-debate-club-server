const admin = require('firebase-admin');
const serviceAccount = require('./just-debate-club-firebase-adminsdk-fbsvc-914081a719.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Export Firebase Admin instance to use it in other parts of your app
module.exports = admin;
