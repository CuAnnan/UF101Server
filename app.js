const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const userRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.disable('x-powered-by');

app.use('/', indexRouter);
app.use('/users/', userRouter);


console.log('Trying to connect to mongo db instance');
const db = require('./mongo');
db.connect().then(()=>{
  console.log('Connected to mongoose instance');
}).catch((err)=>{
  console.log(err);
});

const conf = require('./conf');
const session = require('express-session');

const sess = {
  secret: conf.session.secret,
  saveUninitialized: true,
  resave: false,
  cookie: {}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send("File not found")
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);
  // render the error page
  res.status(500).render('serverError');
});



module.exports = app;
