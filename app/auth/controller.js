const User = require('./model');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

const { getToken } = require('../utils/getToken');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const registerUser = async (req, res, next) => {
    try {
        const payload = req.body;
        const user = new User(payload);
        await user.save();

        // Remove sensitive data from response
        const { password, token, ...userResponse } = user.toJSON();

        return res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
        });
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.status(422).json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }

        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(409).json({
                error: 1,
                message: 'Email already registered',
            });
        }

        return res.status(500).json({
            error: 1,
            message: 'Internal server error',
        });
    }
};

const localStrategy = async (email, password, done) => {
    try {
        const user = await User.findOne({ email })
            .select('_id email password full_name role customer_id')
            .lean();

        // Check if user exists first
        if (!user) return done(null, false);

        // Then check password
        const comparePassword = await bcrypt.compare(password, user.password);

        if (comparePassword) {
            delete user.password;
            return done(null, user);
        }

        return done(null, false);
    } catch (error) {
        return done(error, null);
    }
};

const loginUser = async (req, res, next) => {
    passport.authenticate('local', async (err, user) => {
        if (err) {
            return sendError(
                res,
                'Internal server error',
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }

        if (!user) {
            return sendError(
                res,
                'Email or password incorrect',
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        try {
            const tokenPayload = {
                _id: user._id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                customer_id: user.customer_id,
            };
            const signed = jwt.sign(tokenPayload, config.secretKey, {
                expiresIn: '24h',
            });

            return sendSuccess(
                res,
                'Logged in successfully',
                {
                    token: signed,
                },
                HTTP_STATUS.OK
            );
        } catch (error) {
            return sendError(
                res,
                `You're not logged in or token expired`,
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    })(req, res, next);
};

const me = (req, res, next) => {
    if (!req.user) {
        return sendError(
            res,
            `You're not logged in or token expired`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
    const { _id, full_name, email, role, customer_id } = req.user;
    const user = {
        _id,
        full_name,
        email,
        role,
        customer_id,
    };

    return sendSuccess(res, 'Success', user, HTTP_STATUS.OK);
};

const logoutUser = async (req, res, next) => {
    try {
        // Just verify the token exists and is valid
        const token = getToken(req);

        if (!token) {
            return sendError(
                res,
                'No token provided',
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

        // Verify token is valid (will throw if invalid/expired)
        try {
            jwt.verify(cleanToken, config.secretKey);
        } catch (error) {
            return sendError(
                res,
                'Token expired or invalid',
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        // Success - client should remove token
        // Token will naturally expire in 24h
        return sendSuccess(res, 'Logout successful', null, HTTP_STATUS.OK);
    } catch (error) {
        console.error('Logout error:', error);
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

module.exports = { registerUser, localStrategy, loginUser, me, logoutUser };
