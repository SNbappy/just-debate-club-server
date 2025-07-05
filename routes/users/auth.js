const express = require('express');
const verifyFirebaseToken = require('../../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // POST: Create user entry (for signup)
    router.post('/', async (req, res) => {
        try {
            console.log('👤 User creation endpoint hit');

            const { name, email } = req.body;

            if (!name || !email) {
                return res.status(400).json({ message: "Name and email are required" });
            }

            // Check if user already exists
            const existingUser = await collections.users.findOne({ email });
            if (existingUser) {
                console.log('✅ User already exists:', email);
                return res.status(200).json({
                    message: "User already exists",
                    insertedId: existingUser._id,
                    role: existingUser.role
                });
            }

            // Default role and permissions
            const defaultRole = 'user';
            const defaultPermissions = [
                'view_profile',
                'edit_profile',
                'join_events',
                'view_members',
                'participate_debates'
            ];

            // Create new user with complete structure
            const newUser = {
                name,
                email,
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
                role: defaultRole,
                permissions: defaultPermissions,
                isActive: true,
                adminLevel: null,
                roleAssignedAt: new Date(),
                assignedBy: 'system',
                joinedAt: new Date(),
                lastUpdated: new Date()
            };

            const result = await collections.users.insertOne(newUser);
            console.log('✅ New user created with default role "user":', email);

            res.status(201).json({
                message: "User created successfully with default role",
                insertedId: result.insertedId,
                role: defaultRole,
                permissions: defaultPermissions
            });
        } catch (error) {
            console.error('❌ User creation error:', error);
            res.status(500).json({
                message: "Failed to create user",
                error: error.message
            });
        }
    });

    // GET: Get role permissions (Protected)
    router.get('/permissions', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('🔐 Permissions endpoint hit for user:', req.user.email);

            const user = await collections.users.findOne({ email: req.user.email });

            if (!user) {
                // Auto-create user if not exists
                const defaultUser = {
                    email: req.user.email,
                    name: req.user.name || req.user.displayName || '',
                    role: 'user',
                    permissions: ['view_profile', 'edit_profile', 'join_events'],
                    isActive: true,
                    joinedAt: new Date(),
                    lastUpdated: new Date()
                };

                await collections.users.insertOne(defaultUser);
                return res.status(200).json({
                    role: 'user',
                    permissions: ['view_profile', 'edit_profile', 'join_events'],
                    adminLevel: null
                });
            }

            res.status(200).json({
                role: user.role || 'user',
                permissions: user.permissions || ['view_profile', 'edit_profile', 'join_events'],
                adminLevel: user.adminLevel || null
            });
        } catch (error) {
            console.error('❌ Permissions fetch error:', error);
            res.status(500).json({
                message: "Failed to fetch permissions",
                error: error.message
            });
        }
    });

    return router;
};
