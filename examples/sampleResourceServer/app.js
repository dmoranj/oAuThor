
/**
 * Module dependencies.
 */

var express = require('express'),
    diaries = require('./routes/diaryManagement'),
    users = require('./routes/userManagement'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
  app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.post('/login', users.authenticate);
app.post('/user', users.create);
app.get('/user/:userId', users.get);
app.get('/user', users.list);
app.delete('/user/:userId', users.remove);
app.post('/user/:userId/diary', diaries.create);
app.get('/user/:userId/diary', diaries.list);
app.get('/user/:userId/diary/:diaryId', diaries.get);
app.delete('/user/:userId/diary/:diaryId', diaries.remove);
app.post('/user/:userId/diary/:diaryId/log', diaries.log);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
