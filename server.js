'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const routes = require('./routes.js');
const auth = require('./auth.js');
var session = require('express-session');
const passport = require('passport');

const app = express();

fccTesting(app); //For FCC testing purposes

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


myDB(async client => {
  const myDataBase = await client.db('database').collection('users')
  console.log("DB connected");
  routes(app, myDataBase);
  auth(app, myDataBase);
  
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
 
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });

  // app.get('/api/users/86', (req, res) => {
  //   Person.deleteMany({ username: { $exists: true } }, req.body, (err, data) => {
  //     !err ? console.log("Deleted Many!") : console.log(err);
  //     res.json({ 'Objects with usernames have been deleted': null })
  //   })
  // });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
