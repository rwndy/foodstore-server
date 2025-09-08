const router = require('express').Router();
const multer = require('multer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const userController = require('./controller');

passport.use(new LocalStrategy({usernameField: 'email'},
userController.localStrategy));

router.post('/register', multer().none(), userController.registerUser);
router.post('/login', multer().none(), userController.loginUser)
router.get('/me', userController.me)
router.post('/logout', userController.logoutUser)

module.exports = router;
