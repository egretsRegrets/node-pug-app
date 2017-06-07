const passport = require('passport');
const crypto = require('crypto'); // built in node package, no npm needed
const promisify = require('es6-promisify');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {// local authentication strategy uses credentials local to our app; we could also use FB or Twitter
    // authentication strategies must be configured before use; see ../handlers/passport.js
    failureRedirect: '/login',
    failureFlash: 'Oops, Login Failed 😢',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out 👋');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){ //passport method
        next();
        return;
    }
    req.flash('error', 'Oops, you have to be logged in first 👇');
    res.redirect('/login');
};

exports.forgot = async (req, res)=> {
    //1. see if user with email exists in db
    const user = await User.findOne({ email: req.body.email });
    if (!user){
        req.flash('success', 'Reset instructions have been sent to your email 🙇‍');
        // it's a bad security practice in lots of cases to let a user know that an account does not exist for that email
        return res.redirect('/login');
    }
    //2. set reset tokens and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + ((60 * 60) * 1000); // 1 hr in ms
    await user.save();
    //3. send them an email containing token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user, // (user: user)
        subject: 'Password Reset',
        resetURL, //(resetURL: resetURL)
        filename: 'password-reset' // this will be our pug file to render
    });
    req.flash('success', `Reset instructions have been sent to your email 🙇‍`);
    //4. redirect to login page
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() } // greater than mongo query
    });
    // if the token or token time limit aren't right
    if(!user){
        req.flash('error', 'Password token is invalid or has expired! 👎');
        return res.redirect('/login');
    }
    // if we find the user, show a reset password form

    res.render('reset', { title: 'Reset your 💩', user });
};

exports.confirmedController = (req, res, next) => {
    if(req.body.password === req.body['confirm-password']){
        return next();
    }
    req.flash('error', 'Those new passwords don\'t seem to match. You goof? 💁‍');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() } // greater than mongo query
    });
    if(!user){
        req.flash('error', 'Whoops, looks like your token is invalid or has expired 🛑');
        return res.redirect('/login');
    }
    
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser); // passport method
    req.flash('success', 'You\'re all updated 🕺');
    res.redirect('/account');
};