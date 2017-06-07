const mongoose = require('mongoose');
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [
            validator.isEmail,
            'Invalid Email Address 😢'
        ],
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Store'
        }
    ]
});

userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email); // gravatar uses a hashed email to associate an image
    return `https://gravatar.com/avatar/${hash}?s=200`;
});
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler); // this plugin gives us much nicer error msgs to surface to our user

module.exports = mongoose.model('User', userSchema);