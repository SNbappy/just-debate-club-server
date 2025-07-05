const express = require('express');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const statsRoutes = require('./stats');

module.exports = (collections) => {
    const router = express.Router();

    // API Information endpoint
    router.get('/', async (req, res) => {
        try {
            console.log('📋 Users API info requested');

            const totalUsers = await collections.users.countDocuments({});

            res.status(200).json({
                message: "JUST Debate Club Users API",
                version: "2.0.0",
                totalUsers,
                endpoints: {
                    "POST /users": "Create new user",
                    "GET /users/profile": "Get user profile (requires auth)",
                    "PUT /users/profile": "Update user profile (requires auth)",
                    "GET /users/stats": "Get user statistics (requires auth)",
                    "GET /users/permissions": "Get user permissions (requires auth)",
                    "GET /users/admin/all": "Get all users (admin only)",
                    "PUT /users/admin/assign-role": "Assign role to user (admin only)"
                },
                modules: [
                    "Authentication & Permissions",
                    "Profile Management",
                    "Admin Operations",
                    "User Statistics"
                ]
            });
        } catch (error) {
            console.error('❌ Users API info error:', error);
            res.status(500).json({
                message: "Failed to fetch API information",
                error: error.message
            });
        }
    });

    // Mount sub-routes
    router.use('/', authRoutes(collections));
    router.use('/', profileRoutes(collections));
    router.use('/admin', adminRoutes(collections));
    router.use('/', statsRoutes(collections));

    return router;
};
