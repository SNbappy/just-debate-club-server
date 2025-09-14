const express = require('express');
const { ObjectId } = require('mongodb');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // GET: List users with pagination
    router.get('/', async (req, res) => {
        try {
            console.log('📋 Users endpoint accessed via GET');

            // Pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20; // Increased default
            const skip = (page - 1) * limit;

            // Get total count
            const totalCount = await collections.users.countDocuments({});

            // Get paginated users
            const users = await collections.users.find({})
                .sort({ _id: -1 }) // Most reliable sort
                .skip(skip)
                .limit(limit)
                .toArray();

            const sanitizedUsers = users.map(user => ({
                _id: user._id,
                name: user.name || 'No Name',
                email: user.email,
                role: user.role || 'user',
                isActive: user.isActive !== false,
                joinedAt: user.joinedAt || user._id.getTimestamp(),
                department: user.department || null,
                batch: user.batch || null
            }));

            // UPDATE this part in your existing POST / route (in the completeNewUser object):
            const completeNewUser = {
                // Basic info
                name: name.trim(),
                email: email.toLowerCase().trim(),

                // Profile fields (UPDATE THESE)
                phone: '',
                department: '',
                studentId: '',
                batch: '',
                location: '', // ADD THIS
                experienceLevel: 'Beginner', // ADD THIS
                preferredFormats: [], // ADD THIS
                specialties: [], // ADD THIS
                bio: '',
                skills: [], // Keep this if you want
                socialLinks: {
                    facebook: '',
                    twitter: '',
                    linkedin: ''
                },
                photoURL: '',

                // Role and permissions (keep as is)
                role: 'user',
                permissions: [
                    'view_profile',
                    'edit_profile',
                    'join_events',
                    'view_members',
                    'participate_debates'
                ],

                // Status and timestamps (keep as is)
                isActive: true,
                joinedAt: new Date(),
                lastUpdated: new Date()
            };


            res.status(200).json({
                message: "JUST Debate Club Users API",
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalUsers: totalCount,
                    usersPerPage: limit,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                },
                users: sanitizedUsers,
                endpoints: {
                    "POST /users": "Create new user",
                    "GET /users?page=1&limit=20": "Get paginated users",
                    "GET /users/profile": "Get user profile (requires auth)",
                    "GET /users/stats": "Get user statistics (requires auth)",
                    "PUT /users/profile": "Update user profile (requires auth)",
                    "GET /users/permissions": "Get user permissions (requires auth)",
                    "GET /users/all": "Get all users (admin only)",
                    "PUT /users/assign-role": "Assign role to user (admin only)"
                }
            });
        } catch (error) {
            console.error('❌ Users GET error:', error);
            res.status(500).json({
                message: "Failed to fetch users",
                error: error.message
            });
        }
    });

    // POST: Create user entry (for signup) - ENHANCED
    router.post('/', async (req, res) => {
        try {
            console.log('👤 User creation endpoint hit');
            console.log('📨 Request body:', req.body);

            const { name, email } = req.body;

            // Validation
            if (!name || !email) {
                console.log('❌ Missing required fields');
                return res.status(400).json({ message: "Name and email are required" });
            }

            // Check if user already exists
            const existingUser = await collections.users.findOne({ email });
            if (existingUser) {
                console.log('⚠️ User already exists:', email);

                // If existing user is incomplete, fix it
                if (!existingUser.role) {
                    console.log('🔧 Fixing incomplete existing user...');
                    const updateFields = {
                        role: 'user',
                        permissions: [
                            'view_profile',
                            'edit_profile',
                            'join_events',
                            'view_members',
                            'participate_debates'
                        ],
                        isActive: true,
                        phone: existingUser.phone || '',
                        department: existingUser.department || '',
                        studentId: existingUser.studentId || '',
                        batch: existingUser.batch || '',
                        bio: existingUser.bio || '',
                        skills: existingUser.skills || [],
                        socialLinks: existingUser.socialLinks || {
                            facebook: '',
                            twitter: '',
                            linkedin: ''
                        },
                        photoURL: existingUser.photoURL || '',
                        joinedAt: existingUser.joinedAt || new Date(),
                        lastUpdated: new Date()
                    };

                    await collections.users.updateOne(
                        { _id: existingUser._id },
                        { $set: updateFields }
                    );

                    console.log('✅ Fixed existing incomplete user');
                }

                return res.status(200).json({
                    message: "User already exists",
                    insertedId: existingUser._id,
                    role: existingUser.role || 'user'
                });
            }

            // Create COMPLETE new user object
            const completeNewUser = {
                // Basic info
                name: name.trim(),
                email: email.toLowerCase().trim(),

                // Profile fields
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
                photoURL: '',

                // Role and permissions
                role: 'user',
                permissions: [
                    'view_profile',
                    'edit_profile',
                    'join_events',
                    'view_members',
                    'participate_debates'
                ],

                // Status and timestamps
                isActive: true,
                joinedAt: new Date(),
                lastUpdated: new Date()
            };

            console.log('💾 Creating complete user object...');
            console.log('🔍 User object keys:', Object.keys(completeNewUser));

            // Insert the complete user
            const result = await collections.users.insertOne(completeNewUser);

            if (!result.insertedId) {
                throw new Error('User insertion failed - no insertedId returned');
            }

            console.log('✅ Complete user created successfully:', email);
            console.log('🆔 Inserted ID:', result.insertedId);

            // Verify the insertion by fetching the created user
            const verifyUser = await collections.users.findOne({ _id: result.insertedId });
            console.log('🔍 Verification - Created user has role:', verifyUser?.role);

            res.status(201).json({
                message: "Complete user created successfully",
                insertedId: result.insertedId,
                role: 'user',
                fieldsCreated: Object.keys(completeNewUser).length,
                verification: {
                    hasRole: !!verifyUser?.role,
                    hasPermissions: !!verifyUser?.permissions,
                    isActive: verifyUser?.isActive
                }
            });

        } catch (error) {
            console.error('❌ User creation error:', error);
            res.status(500).json({
                message: "Failed to create user",
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });

    // GET: Get current user profile (Protected)
    // UPDATE this part in your existing GET /profile route
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
                    location: '', // ADD THIS FIELD
                    experienceLevel: 'Beginner', // ADD THIS FIELD
                    preferredFormats: [], // ADD THIS FIELD  
                    specialties: [], // ADD THIS FIELD
                    bio: '',
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
                    joinedAt: new Date(),
                    lastUpdated: new Date(),
                    roleAssignedAt: new Date(),
                    assignedBy: 'system'
                };

                await collections.users.insertOne(newProfile);
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


    // GET: Get user stats (Protected)
    router.get('/stats', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('📊 Stats endpoint hit for user:', req.user.email);

            const userProfile = await collections.users.findOne({
                email: req.user.email
            });

            const stats = {
                totalDebates: 12,
                wins: 8,
                tournaments: 3,
                rank: userProfile?.role === 'admin' ? 'Administrator' : 'Advanced',
                joinDate: userProfile?.joinedAt || new Date('2024-01-15'),
                achievements: [
                    'First Debate Winner',
                    'Monthly Champion',
                    'Best Speaker'
                ]
            };

            console.log('✅ Stats generated for user:', req.user.email);
            res.status(200).json(stats);
        } catch (error) {
            console.error('❌ Stats fetch error:', error);
            res.status(500).json({
                message: "Failed to fetch stats",
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
                return res.status(404).json({ message: "User not found" });
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

    // GET: Get all users (Admin only)
    router.get('/all', verifyFirebaseToken, async (req, res) => {
        try {
            console.log('👥 All users request from:', req.user.email);

            const requestingUser = await collections.users.findOne({ email: req.user.email });
            if (!requestingUser || requestingUser.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access required' });
            }

            const users = await collections.users.find({})
                .sort({ joinedAt: -1 })
                .toArray();

            const sanitizedUsers = users.map(user => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                batch: user.batch,
                isActive: user.isActive,
                joinedAt: user.joinedAt,
                photoURL: user.photoURL
            }));

            res.status(200).json(sanitizedUsers);
        } catch (error) {
            console.error('❌ Users fetch error:', error);
            res.status(500).json({
                message: "Failed to fetch users",
                error: error.message
            });
        }
    });

    // PUT: Assign role to user (Admin only)
    router.put('/assign-role', verifyFirebaseToken, async (req, res) => {
        const { userId, newRole } = req.body;

        try {
            console.log('🔄 Role assignment request from:', req.user.email);

            const adminUser = await collections.users.findOne({ email: req.user.email });
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access required' });
            }

            if (!userId || !newRole) {
                return res.status(400).json({ message: "User ID and role are required" });
            }

            if (!['admin', 'user'].includes(newRole)) {
                return res.status(400).json({ message: "Invalid role specified" });
            }

            const targetUser = await collections.users.findOne({ _id: new ObjectId(userId) });
            if (!targetUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const defaultPermissions = {
                admin: [
                    'view_profile', 'edit_profile', 'join_events',
                    'manage_users', 'manage_events', 'manage_gallery',
                    'manage_alumni', 'view_analytics', 'system_settings'
                ],
                user: [
                    'view_profile', 'edit_profile', 'join_events',
                    'view_members', 'participate_debates'
                ]
            };

            const updateData = {
                role: newRole,
                permissions: defaultPermissions[newRole],
                roleAssignedAt: new Date(),
                assignedBy: req.user.email,
                lastUpdated: new Date()
            };

            if (newRole === 'admin') {
                updateData.adminLevel = 'normal';
            } else {
                updateData.adminLevel = null;
            }

            const result = await collections.users.updateOne(
                { _id: new ObjectId(userId) },
                { $set: updateData }
            );

            if (result.modifiedCount === 0) {
                return res.status(400).json({ message: "Failed to update user role" });
            }

            console.log('✅ Role updated:', targetUser.email, 'to', newRole);
            res.status(200).json({
                message: `User role updated to ${newRole} successfully`
            });
        } catch (error) {
            console.error('❌ Role assignment error:', error);
            res.status(500).json({
                message: "Failed to assign role",
                error: error.message
            });
        }
    });

    // PUT: Update user profile (Protected)
    // REPLACE your existing PUT /profile route with this:
    router.put('/profile', verifyFirebaseToken, async (req, res) => {
        const {
            name,
            phone,
            department,
            studentId,
            batch,
            location, // NEW FIELD
            experienceLevel, // NEW FIELD
            preferredFormats, // NEW FIELD
            specialties, // NEW FIELD
            bio,
            socialLinks,
            photoURL
        } = req.body;

        try {
            console.log('🔄 Profile update for user:', req.user.email);
            console.log('📝 Update data received:', req.body);

            // Validation
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: "Name is required"
                });
            }

            // Prepare update object with all the fields
            const updatedProfile = {
                name: name.trim(),
                phone: phone || '',
                department: department || '',
                studentId: studentId || '',
                batch: batch || '',
                location: location || '', // NEW
                experienceLevel: experienceLevel || 'Beginner', // NEW
                preferredFormats: Array.isArray(preferredFormats) ? preferredFormats : [], // NEW
                specialties: Array.isArray(specialties) ? specialties : [], // NEW
                bio: bio || '',
                socialLinks: socialLinks || {
                    facebook: '',
                    twitter: '',
                    linkedin: ''
                },
                photoURL: photoURL || '',
                lastUpdated: new Date()
            };

            console.log('💾 Updating with data:', updatedProfile);

            const result = await collections.users.updateOne(
                { email: req.user.email },
                {
                    $set: updatedProfile,
                    $setOnInsert: {
                        email: req.user.email,
                        joinedAt: new Date(),
                        role: 'user',
                        permissions: ['view_profile', 'edit_profile', 'join_events'],
                        isActive: true
                    }
                },
                { upsert: true }
            );

            // Get the updated user to return
            const updatedUser = await collections.users.findOne({ email: req.user.email });

            console.log('✅ Profile updated for user:', req.user.email);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedUser, // Return the updated user data
                modifiedCount: result.modifiedCount,
                upsertedCount: result.upsertedCount
            });
        } catch (error) {
            console.error('❌ Profile update error:', error);
            res.status(500).json({
                success: false,
                message: "Failed to update profile",
                error: error.message
            });
        }
    });


    return router;
};
