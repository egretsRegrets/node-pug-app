const mongoose = require('mongoose');
// configure mongoose promise to the native Promise object (for es6 promise features: async/await)
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'please enter a store name' // acts as 'true' and provides error message
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You Must Supply an Author'
    }
},{ // anytime a document in this schema is converted to JSON or an Object, make sure virtual fields get displayed
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Define our indexes:

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next){ // have to use a keyword 'function' here because we need 'this' to refer to the store object being saved
    if (!this.isModified('name')) { // if a name isn't added or changed then just go to next
        return next();
    }
    this.slug = slug(this.name);
    // the above uses our slug property to set the slug value of the store to it's name

    // we need to check against the db to make sure the slug isn't already present on some doc
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({slug: slugRegEx});
    if(storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }

    next();
});

storeSchema.statics.getTagsList = function() { // add a method to the schema by placing it on the statics prop of the schema
    // have to use this function syntax to use this
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        // above: creates groups, each group is gathered by tag and get tag name as id,
            // count is a property on each group; count is incremented by 1 for each member aggregated in the group.
        { $sort: {count: -1} } // -1 indicates descending order
    ]);
};

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // lookup stores and populate their reviews
        {$lookup:
            // from value name is the Review schema name, made lower-case and plural
            {from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews'}
        },
        // filter for stores that have at least 2 reviews
        {$match:
            // 'reviews.1' is the second item in reviews
            { 'reviews.1': {$exists: true} }
        },
        // add an average review field
        {$project:
            {photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            slug: '$$ROOT.slug',
            reviews: '$$ROOT.reviews',
            averageRating: {$avg: '$reviews.rating'}}
        },
        // sort stores by our new field, highest reviews first
        {$sort:
            {averageRating: -1}
        },
        // limit to 10 at most
        {$limit: 10}
    ]);
};

// find reviews where Review.store is equal to Store._id
storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);