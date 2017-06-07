// in the express router syntax, the method res.render is what we use to render our template

// pug is our templating language in this app
// pug is a popular templating language in the Node community; it used to be called jade.

// in pug <p>Hello!</p> looks like:
    // p Hello!

// in app.js we see

// view engine setup
app.set('views', path.join(__dirname, 'views')); // all of our pug files are in the views folder
app.set('view engine', 'pug'); // here we set our view engine to pug
                                // other templating engines include Moustache and EJS

// so back in the file with our routes:
// in routes/index.js

router.get('/', (req, res, next) => {
    res.render('<desired_template_name>', local_variables); 
});

// res.render takes two variables, the first is the template we want to load. The second are some
    // local variables we  want to pass in to it

// so if we want to pass router info to the template we do so in an object containing those local vars

router.get('/', (req, res, next) => {
    res.render('helloTemplate', { 
        name: 'case' ,
        title: 'joeBoy',
        liveLong: false
    });
});

// then we can reference those variables in our pug file

// we can also make a property passed to the template dynamic:

router.get('/', (req, res, next) => {
    res.render('helloTemplate', { 
        name: req.query.name, // here we're pulling from the name field in the query string
        title: 'joeBoy',
        liveLong: false
    });
});

// in express, the passed properties are often referred to as local variables or just locals