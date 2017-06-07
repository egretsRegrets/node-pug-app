// in express middleware is what is used to perform tasks that happen between request and response.
    // middle ware often uses the next method to chain actions performed on a request object or one of its properties

// we can use the next() method to chain functions internal to the controller method containing the next() method,
    // but we can also use next() to set up function chaining where the first function is called
        // so that:

    // in our controller we have:

    exports.myMiddleware = (req, res, next) => {
        req.name = 'Sam';
        next();
    };

    exports.homePage = (req, res) => {
        console.log(req.name);
        res.render('index');
    };

    // and in our route file where the controller is consumed:

    router.get('/', storeController.myMiddleware, storeController.homePage);

        // in the above, the .homePage() method is setup as the function used in the .next() of .myMiddleware

// the above is an example of route specific middleware, but express also has global middleware

// global middleware acts on every request before that request is even processed by a router
    // global middleware makes up most of app.js

// app.use is the method for applying global middleware

// we do a ton of global middleware before we hit our routing call (which sets our routes)
    // but we also define some global middleware after the router is defined
    // after the router, we typically define our error handling