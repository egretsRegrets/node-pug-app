const mongoose = require('mongoose');
const User = mongoose.model('User'); // remember must be imported in start js to use here
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'});
};

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'});
};

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name'); // sanitizeBody method provided to .req by expressValidator (app.js)
    req.checkBody('name', 'You must supply a name').notEmpty();
    req.checkBody('email', 'That email is not valid').notEmpty().isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank').notEmpty();
    req.checkBody('confirm-password', 'Confirmed password cannot be blank').notEmpty();
    req.checkBody('confirm-password', 'Oops your passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if(errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return;
    }
    next();
};

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    // the following .register method is provided by passportLocalMongoose (see User model)
    // we're going to use register because that passportLocalMongoose .register method doesn't return a promise
    // we have to pass User to promisify, because User.register lives on User
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    // the point of register is to hash passwords instead of saving a raw password
    next();
};

exports.account = (req, res) => {
    res.render('account', {title: 'Edit Your Account'});
};

exports.updateAccount = async (req, res) =>{
    const updates = {
        name: req.body.name,
        email: req.body.email
    };
    // findOneAndUpdate takes three params: query, update, options
    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates }, // will compare and replace using our updates object and the query return
        { new: true, runValidators: true, context: 'query' } // new: true returns the new doc obj; runValidators makes sure our schema
                                                                // validators are run; context must be supplied
    );

    req.flash('success', 'account successfully updated! 👍');
    res.redirect('back');
};