const User = require('./model');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

const { getToken } = require('../utils/getToken');

const registerUser = async (req, res, next) => {
    try {
        const payload = req.body;

        const user = new User(payload);

        await user.save();

        return res.json(user);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }
        next(error);
    }
};

const localStrategy = async (email, password, done) => {
    try {
        const user = await User.findOne({ email }).select(
            '-__v -createdAt -updatedAt -cart_items -token'
        );

        const comparePassword = bcrypt.compareSync(password, user.password);

        if (!user) return done();

        if (comparePassword) {
            ({ password, ...userWithoutPassword } = user.toJSON());

            return done(null, userWithoutPassword);
        }
    } catch (error) {
        done(error, null);
    }

    done();
};

const loginUser = async (req, res, next) => {
    passport.authenticate('local', async (err, user) => {
        if (err) return next(err);

        if (!user)
            return res.json({
                error: 1,
                message: 'email or password incorrect',
            });

        const signed = jwt.sign(user, config.secretKey);
        await User.findOneAndUpdate(
            { _id: user._id },
            { $push: { token: signed } },
            { new: true }
        );

        return res.json({
            message: 'logged in successfully',
            user: user,
            token: signed,
        });
    })(req, res, next);
};

const me = (req, res, next) => {
    if (!req.user) {
        return res.json({
            error: 1,
            message: `You're not logged in or token expired`,
        });
    }

    return res.json(req.user);
};


const logoutUser = async (req, res, next) => {
    const token = getToken(req);

    const user = await User.findOneAndUpdate(
        { token: { $in: [token] } },
        { $pull: { token } },
        { useFindAndModify: false }
    );

    if (!user || !token) {
        return res.json({
            error: 1,
            message: 'No user found',
        });
    }

    return res.json({
        error: 0,
        message: 'Logout berhasil',
    });
};

module.exports = { registerUser, localStrategy, loginUser, me, logoutUser };
