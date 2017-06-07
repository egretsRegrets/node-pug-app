const mongoose = require('mongoose');
const jimp = require('jimp'); // package to alter uploaded images
const uuid = require('uuid'); // package to help us assign unique id's to uploaded images
const multer = require('multer'); // package that will allow us to use multipart form-data, needed for image upload
const User = mongoose.model('User');
const Store = mongoose.model('Store'); // remember we imported our Store.js in start.js

const multerOptions = {
    // we want to resize our photo
    // first we're just going to save the uploaded photo to memory, not to disc - we don't want to keep the original
    storage: multer.memoryStorage(),
    fileFilter (req, file, callback){ // es6 method shorthand
        // want to do server side validation to make sure we have an image file, so we match against acceptable mimetypes
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            callback(null, true);
        } else {
            callback({ message: 'That filetype is not supported' }, false);
        }
    }
};

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)){ // equals allows us to compare the ObjectId prop to a string
        throw Error('You must own a store in order to edit it! 👮‍');
    }
};

exports.homePage = (req, res) => {
    res.render('index');
};


exports.addStore = (req, res) => {
    res.render('editStore', { 
        title: 'Add Store'
     });
};

// upload will read the uploaded file into server memory (not save it to disk)
exports.upload = multer(multerOptions).single('photo'); // single() says we just want to use multer on a single field called photo

exports.resize = async (req, res, next) => {
    // see if there is no file to resize
    if (!req.file){ // multer puts the uploaded file on req.file
        next(); // just skip to next controller
        return;
    }
    // here we're going to make the photo name and set that value equal to req.body.photo
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    // we can pass jimp.read() either a path or a buffer
        // here we have an easily accessible buffer
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // now we pass to next controller
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    // the store number to skip on a new page:
    const skip = (page * limit) - limit;
    // 1. query database for list of stores
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created: 'desc'});
    const countPromise = Store.count();
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if(!stores.length && pages){
        req.flash('info', `Hey! You requested page ${page}. But that page doesn't exist. So I put you on page ${pages} instead.`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    // 2. pass stores to Stores view
    res.render('stores', { title: 'Stores', stores, count, page, pages}); // stores key and val have same name
};

exports.editStore = async (req, res) => {
    // 1. find the store given the id (from the req object)
    const store = await Store.findOne({_id: req.params.id});
    // 2. confirm that user is the owner of the store
    confirmOwner(store, req.user);
    // 3. render out edit form for user to update store
    res.render('editStore', {title: `edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    // 1. find and update store
    // quickly set location coord data to points, because defaults will not kick in when updating
    req.body.location.type = 'Point';
    // the findOneAndUpdate mongodb method takes 3 params, (query, data, options)
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, // return new store instead of old, which is default
        runValidators: true // will re-run validators like required and trim on edit (see model)
    }).exec(); // exec() executes the query
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href='/stores/${store.slug}'>View store</a>`);
    // 2. redirect user to store page and flash message update success
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug})
        .populate('author reviews');
    if(!store) return next();
    // this will kick to app.use(errorHandlers.notFound) in app.js 
        // -- it's the next thing after app.use('/', routes)
    res.render('store', {title: store.name, store});
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true }
    // above: gives us a default when querying for stores - in case there is not pageTag
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    
    const [tags, stores]  = await Promise.all([tagsPromise, storesPromise]);
    
    
    res.render('tag', {tag, tags, stores, title: 'Tags'});
};

exports.searchStores = async (req, res) => {
    // we can only do the following because we indexed name and descrip as text in Store schema
    const stores = await Store
    .find({ // 1st: find stores that match query
        $text: {
            $search: req.query.q
        }
    }, { // 2nd: assign score
         // this second option to find() is the projection; it adds another field to the return
        score: { $meta: 'textScore' }
    })
    .sort({ // sort by score, using textScore metadata
        score: { $meta: 'textScore' }
    })
    //limit to only top 5 results
    .limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat]
        .map(parseFloat); // quick map from query strings to floats

    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates // coordinates: coordinates
                },
                $maxDistance: 10000 // in meters: (10km)
            }
        }
    };
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', {title: 'Map'});
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString()); 
    // ObjectId data type looks like a string but is an object; MongoDB allows us to use toString in this way
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(
            req.user._id,
            { [operator]: { hearts: req.params.id } },
            // operator is a computed property, so it will either be 'pull' or 'addToSet'
            { new: true }
        );
    res.json(user);
};

exports.getHeartedStores = async (req, res) => {
    const stores = await Store.find({
        _id: {$in: req.user.hearts}
    });
    res.render('stores', {title:'Favorite Stores', stores});
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', {title: 'Top Stores', stores});
};