const jwt = require('jsonwebtoken');

const { getToken } = require('../utils/getToken');
const config = require('../config');
const User = require('../auth/model');

const decodeToken = () => {
    return async (req, res, next) => {
        try {
            const token = getToken(req);

            if (!token) return next();

            req.user = jwt.verify(token, config.secretKey);
            const user = await User.findOne({ token: { $in: [token] } });

            if (!user) {
                return res.json({
                    error: 1,
                    message: `Token expired`,
                });
            }
        } catch (error) {
            if (error && error.name === 'JsonWebTokenError') {
                return res.json({
                    error: 1,
                    message: err.message,
                });
            }
            next(error);
        }
        return next()
    };
};

module.exports = { decodeToken }