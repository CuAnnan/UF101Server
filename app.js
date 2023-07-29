var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

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

const multer  = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage:storage });

console.log('Trying to connect to mongo db instance');
const db = require('./mongo');
db.connect().then(()=>{
  console.log('Connected to mongoose instance');
}).catch((err)=>{
  console.log(err);
});


app.post('/', upload.single('mapImage'), function(req, res, next){
  console.log(req.file);
  console.log(req.body);
  res.json({
    form:'handled',
    response:true
  });
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send("File not found")
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(500).send('Server error');
});

module.exports = app;
