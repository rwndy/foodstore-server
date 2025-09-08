const jwt = require('jsonwebtoken');

const { getToken } = require('../utils/getToken');
const config = require('../config');
const User = require('../auth/model');

const decodeToken = () => {
    return async (req, res, next) => {
        try {
            const token = getToken(req);

            if (!token) return next();

            // Add token format validation
            if (typeof token !== 'string' || token.trim() === '') {
                return res.json({
                    error: 1,
                    message: 'Invalid token format',
                });
            }

            // Clean the token (remove 'Bearer ' prefix if present)
            const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

            // Validate token format (JWT should have 3 parts separated by dots)
            if (cleanToken.split('.').length !== 3) {
                return res.json({
                    error: 1,
                    message: 'jwt malformed',
                });
            }

            // Verify the token
            req.user = jwt.verify(cleanToken, config.secretKey);
            const user = await User.findOne({ token: { $in: [cleanToken] } });

            if (!user) {
                return res.json({
                    error: 1,
                    message: `Token expired`,
                });
            }

            return next();
        } catch (error) {

            if (error && error.name === 'JsonWebTokenError') {
                return res.json({
                    error: 1,
                    message: error.message,
                });
            }

            if (error && error.name === 'TokenExpiredError') {
                return res.json({
                    error: 1,
                    message: 'Token expired',
                });
            }

            next(error);
        }
    };
};

module.exports = { decodeToken }