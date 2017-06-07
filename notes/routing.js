// routing with express looks like this:
// In this application we dump all our routes in routes/index.js 

//(routes/index.js)

const express = require('express');
const router = express.Router(); // gets the router from express

router.get('/', (req, res, next) => {    
    res.send('Hey it Works!'); // send is a method of express's response object
    // one note, we can only have one res.send inside this callback; will result in 'headers are already sent' err
    console.log('Hey!'); // we can also log to our node console
});

// we can also do lots of other things with our router
    // we can print json to the page:

router.get('/', (req, res, next) => {
    const cowboy = { name: 'case', ocupation: 'joeboy', liveLong: 'false'};
    res.json(cowboy);
});

// or we can get at url query strings
router.get('/', (req, res, next) => {
    res.send(req.query.name);
});
// then if we enter ourAddress/?name=case
    // we'll get case printed to the screen

// or we could pass all of the query data as to json
router.get('/', (req, res, next) => {
    res.json(req.query);
});

// we can also use variables in our route with ':'
router.get('/reverse/:name', (req, res, next) => {
    const reverseName = [...req.params.name].reverse().join('');
    res.send(reverseName);
});

// more about all of this in the express documentation

//here we export the router so we can use it in app.js

module.exports = router;

// then in app.js we import our routes as routes like:

//(app.js)

const routes = require('./routes/index');

// then later on we use our routes:
app.use('/', routes);
// the above says that anytime any user goes to / anything on our app, use the routing process
    // defined in the router file (routes/index.js)

// now we do have some middleware doing some work before we use our router:
    // in our imports we have:
const bodyParser = require('body-parser');

// then later on:

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// the above checks the url, and checks if a user has posted data from a form element or similar mechanism
    // then it puts all of the relevant data in the request so we can later access it in our routing

// we could also have a second route handling special routes, that we might want to divide out:
app.use('/', routes);
app.use('/admin', adminRoutes);

//