const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const reviewSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author! 👮‍'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply an store! 👮‍'
    },
    text: {
        type: String,
        required: 'You must leave a review 👮‍'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: 'Don\'t you want to leave a star-rating, it\'s required 👮‍'
    }
});

function autopopulate(next) {
    this.populate('author');
    next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);