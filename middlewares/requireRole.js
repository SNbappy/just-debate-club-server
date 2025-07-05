const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Get user from database (req.user is from Firebase token)
            const { getCollections } = require('../utils/db');
            const collections = getCollections();

            const user = await collections.users.findOne({
                email: req.user.email
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found in database' });
            }

            if (!user.isActive) {
                return res.status(403).json({ message: 'User account is inactive' });
            }

            // Check if user has required role
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: 'Insufficient permissions',
                    required: allowedRoles,
                    current: user.role
                });
            }

            // Add user role info to request
            req.userRole = user.role;
            req.userPermissions = user.permissions || [];
            req.userDbData = user;

            next();
        } catch (error) {
            console.error('Role verification error:', error);
            res.status(500).json({ message: 'Role verification failed' });
        }
    };
};

module.exports = requireRole;
