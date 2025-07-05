const express = require('express');
const { ObjectId } = require('mongodb');
const verifyFirebaseToken = require('../../middlewares/verifyFirebaseToken');

module.exports = (collections) => {
    const router = express.Router();

    // Middleware to verify admin role
    const requireAdmin = async (req, res, next) => {
        try {
            const user = await collections.users.findOne({ email: req.user.email });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Admin access required',
                    userRole: user?.role || 'unknown'
                });
            }
            req.adminUser = user;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Admin verification failed' });
        }
    };

    // GET: Get all users (Admin only)
    router.get('/all', verifyFirebaseToken, requireAdmin, async (req, res) => {
        try {
            console.log('👥 All users fetch request from admin:', req.user.email);

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
                photoURL: user.photoURL,
                lastUpdated: user.lastUpdated
            }));

            console.log('✅ Users list provided to admin:', req.user.email);
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
    router.put('/assign-role', verifyFirebaseToken, requireAdmin, async (req, res) => {
        const { userId, newRole } = req.body;

        try {
            console.log('🔄 Role assignment request from admin:', req.user.email);

            if (!userId || !newRole) {
                return res.status(400).json({ message: "User ID and role are required" });
            }

            const validRoles = ['admin', 'user'];
            if (!validRoles.includes(newRole)) {
                return res.status(400).json({
                    message: "Invalid role specified",
                    validRoles: validRoles
                });
            }

            const targetUser = await collections.users.findOne({ _id: new ObjectId(userId) });
            if (!targetUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const rolePermissions = {
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
                permissions: rolePermissions[newRole],
                roleAssignedAt: new Date(),
                assignedBy: req.user.email,
                lastUpdated: new Date(),
                adminLevel: newRole === 'admin' ? 'normal' : null
            };

            const result = await collections.users.updateOne(
                { _id: new ObjectId(userId) },
                { $set: updateData }
            );

            if (result.modifiedCount === 0) {
                return res.status(400).json({ message: "Failed to update user role" });
            }

            console.log('✅ Role updated:', targetUser.email, 'to', newRole);
            res.status(200).json({
                message: `User role updated to ${newRole} successfully`,
                updatedUser: {
                    _id: userId,
                    email: targetUser.email,
                    role: newRole,
                    permissions: rolePermissions[newRole]
                }
            });
        } catch (error) {
            console.error('❌ Role assignment error:', error);
            res.status(500).json({
                message: "Failed to assign role",
                error: error.message
            });
        }
    });

    // GET: Search users (Admin only)
    router.get('/search/:query', verifyFirebaseToken, requireAdmin, async (req, res) => {
        const { query } = req.params;

        try {
            console.log('🔍 User search request:', query, 'by admin:', req.user.email);

            const searchResults = await collections.users.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { department: { $regex: query, $options: 'i' } },
                    { studentId: { $regex: query, $options: 'i' } }
                ],
                isActive: true
            }).limit(20).toArray();

            const sanitizedResults = searchResults.map(user => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                batch: user.batch
            }));

            console.log('✅ Search completed, found:', sanitizedResults.length, 'users');
            res.status(200).json({
                query,
                count: sanitizedResults.length,
                users: sanitizedResults
            });
        } catch (error) {
            console.error('❌ User search error:', error);
            res.status(500).json({
                message: "Failed to search users",
                error: error.message
            });
        }
    });

    return router;
};
