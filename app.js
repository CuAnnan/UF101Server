import createError from 'http-errors'
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
import userRouter from './routes/users.js'

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

console.log('Trying to connect to mongo db instance');
import db from './mongo.js';
db.connect().then(()=>{
  console.log('Connected to mongoose instance');
}).catch((err)=>{
  console.log(err);
});

import session from 'express-session';

const sess = {
  secret: process.env.session_secret,
  saveUninitialized: true,
  resave: false,
  cookie: {}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

app.use('/', indexRouter);
app.use('/users/', userRouter);


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



export default app;