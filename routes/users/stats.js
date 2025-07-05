const express = require('express');
const verifyFirebaseToken = require('../../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // GET: Get user stats (Protected)
    router.get('/stats', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('📊 Stats endpoint hit for user:', req.user.email);

            const userProfile = await collections.users.findOne({
                email: req.user.email
            });

            // Basic stats for all users
            const baseStats = {
                totalDebates: 12, // Replace with: await collections.debates.countDocuments({ participantEmail: req.user.email })
                wins: 8, // Replace with actual win count query
                tournaments: 3, // Replace with actual tournament participation
                rank: userProfile?.role === 'admin' ? 'Administrator' : 'Advanced',
                joinDate: userProfile?.joinedAt || new Date('2024-01-15'),
                achievements: [
                    'First Debate Winner',
                    'Monthly Champion',
                    'Best Speaker'
                ]
            };

            // Additional stats for admins
            if (userProfile?.role === 'admin') {
                const adminStats = {
                    totalUsers: await collections.users.countDocuments({}),
                    activeUsers: await collections.users.countDocuments({ isActive: true }),
                    newUsersThisMonth: await collections.users.countDocuments({
                        joinedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                    }),
                    totalEvents: 25, // Replace with actual query
                    activeEvents: 5 // Replace with actual query
                };

                Object.assign(baseStats, adminStats);
            }

            console.log('✅ Stats generated for user:', req.user.email);
            res.status(200).json(baseStats);
        } catch (error) {
            console.error('❌ Stats fetch error:', error);
            res.status(500).json({
                message: "Failed to fetch stats",
                error: error.message
            });
        }
    });

    // GET: Get user activity log (Protected)
    router.get('/activity', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('📋 Activity log request for user:', req.user.email);

            // This would typically come from an activity/audit log collection
            const activityLog = [
                {
                    action: 'profile_updated',
                    timestamp: new Date(),
                    details: 'Updated profile information'
                },
                {
                    action: 'debate_participated',
                    timestamp: new Date(Date.now() - 86400000), // 1 day ago
                    details: 'Participated in weekly debate'
                },
                {
                    action: 'login',
                    timestamp: new Date(Date.now() - 172800000), // 2 days ago
                    details: 'Logged into dashboard'
                }
            ];

            res.status(200).json({
                message: "Activity log retrieved successfully",
                user: req.user.email,
                activities: activityLog
            });
        } catch (error) {
            console.error('❌ Activity log error:', error);
            res.status(500).json({
                message: "Failed to fetch activity log",
                error: error.message
            });
        }
    });

    return router;
};
