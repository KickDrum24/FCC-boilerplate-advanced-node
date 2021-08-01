const passport = require('passport');

module.exports = function (app, myDataBase) {
    console.log("routes.js loaded");
    app.route('/').get((req, res) => {
        res.render('pug', {
            showLogin: true, title: 'Connected to Database', message: 'Please login', showRegistration: true
        });
    });
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/profile')
    });

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
    });

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };
    app.route('/register')
        .post((req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12);
            myDataBase.findOne({ username: req.body.username }, function (err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    myDataBase.insertOne({
                        username: req.body.username,
                        password: hash
                    },
                        (err, doc) => {
                            if (err) {
                                res.redirect('/');
                            } else {
                                // The inserted document is held within
                                // the ops property of the doc
                                next(null, doc.ops[0]);
                            }
                        }
                    )
                }
            })
        },
            passport.authenticate('local', { failureRedirect: '/' }),
            (req, res, next) => {
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false);
                }

                res.redirect('/profile');
            }
        );
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/profile')
    });

    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });
}