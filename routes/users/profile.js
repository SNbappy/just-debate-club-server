const express = require('express');
const verifyFirebaseToken = require('../../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // GET: Get current user profile (Protected)
    router.get('/profile', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('📍 Profile endpoint hit for user:', req.user.email);

            const userProfile = await collections.users.findOne({
                email: req.user.email
            });

            if (!userProfile) {
                console.log('👤 Creating new user profile for:', req.user.email);

                const newProfile = {
                    email: req.user.email,
                    name: req.user.name || req.user.displayName || '',
                    photoURL: req.user.picture || req.user.photoURL || '',
                    phone: '',
                    department: '',
                    studentId: '',
                    batch: '',
                    bio: '',
                    skills: [],
                    socialLinks: {
                        facebook: '',
                        twitter: '',
                        linkedin: ''
                    },
                    role: 'user',
                    permissions: [
                        'view_profile',
                        'edit_profile',
                        'join_events',
                        'view_members',
                        'participate_debates'
                    ],
                    isActive: true,
                    adminLevel: null,
                    roleAssignedAt: new Date(),
                    assignedBy: 'system',
                    joinedAt: new Date(),
                    lastUpdated: new Date()
                };

                await collections.users.insertOne(newProfile);
                console.log('✅ Auto-created profile for user:', req.user.email);
                return res.status(200).json(newProfile);
            }

            console.log('✅ Profile found for user:', req.user.email);
            res.status(200).json(userProfile);
        } catch (error) {
            console.error('❌ Profile fetch error:', error);
            res.status(500).json({
                message: "Failed to fetch profile",
                error: error.message
            });
        }
    });

    // PUT: Update user profile (Protected)
    router.put('/profile', verifyFirebaseToken, async (req, res) => {
        const {
            name,
            phone,
            department,
            studentId,
            batch,
            bio,
            skills,
            socialLinks,
            photoURL
        } = req.body;

        try {
            console.log('🔄 Profile update for user:', req.user.email);

            const updatedProfile = {
                name,
                phone,
                department,
                studentId,
                batch,
                bio,
                skills: skills || [],
                socialLinks: socialLinks || {},
                photoURL,
                lastUpdated: new Date()
            };

            const result = await collections.users.updateOne(
                { email: req.user.email },
                {
                    $set: updatedProfile,
                    $setOnInsert: {
                        email: req.user.email,
                        joinedAt: new Date(),
                        role: 'user',
                        permissions: ['view_profile', 'edit_profile', 'join_events'],
                        isActive: true,
                        roleAssignedAt: new Date(),
                        assignedBy: 'system'
                    }
                },
                { upsert: true }
            );

            console.log('✅ Profile updated for user:', req.user.email);
            res.status(200).json({
                message: "Profile updated successfully",
                modifiedCount: result.modifiedCount,
                upsertedCount: result.upsertedCount
            });
        } catch (error) {
            console.error('❌ Profile update error:', error);
            res.status(500).json({
                message: "Failed to update profile",
                error: error.message
            });
        }
    });

    return router;
};
