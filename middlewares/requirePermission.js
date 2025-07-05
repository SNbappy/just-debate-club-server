const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const { getCollections } = require('../utils/db');
            const collections = getCollections();

            const user = await collections.users.findOne({
                email: req.user.email
            });

            if (!user || !user.isActive) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Check specific permission
            if (!user.permissions || !user.permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    message: `Permission '${requiredPermission}' required`,
                    userPermissions: user.permissions || []
                });
            }

            req.userRole = user.role;
            req.userPermissions = user.permissions;
            req.userDbData = user;

            next();
        } catch (error) {
            console.error('Permission verification error:', error);
            res.status(500).json({ message: 'Permission verification failed' });
        }
    };
};

module.exports = requirePermission;
