'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const ObjectID = require('mongodb').ObjectID;
// const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const routes = require('./routes.js');
const auth = require('./auth.js');
const session = require('express-session');
const passport = require('passport');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require("passport.socketio");
// const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
//initialize a new memory store
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });


fccTesting(app); //For FCC testing purposes

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
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

//tell Socket.IO to use memory store
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

let currentUsers = 0;
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  io.on('connection', socket => {
    ++currentUsers;
    console.log('user ' + socket.request.user.name + ' connected');
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true}
      );

    http.listen(PORT, () => {
      socket.on('disconnect', () => {
        /*anything you want to do on disconnect*/
        --currentUsers;
        console.log('A user has disconnected');
        io.emit('user', {
          name: socket.request.user.name,
          currentUsers,
          connected: false}
          ); 
      });
    })


  });
  
  console.log('Listening on port ' + PORT);
});
