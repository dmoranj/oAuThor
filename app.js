"use strict";

var express = require('express'),
    clientRoutes = require('./routes/clientManagement'),
    grantRoutes = require('./routes/grantManagement'),
    tokenRoutes = require('./routes/tokenManagement'),
    http = require('http'),
    path = require('path'),
    config = require('./config');

function defineRoutes(app) {
    app.post('/register', clientRoutes.create);
    app.post('/grant', grantRoutes.create);
    app.get('/token', tokenRoutes.get);
}

function create(callback) {
    var
        app = express();

    app.configure(function () {
        app.set('port', process.env.PORT || config.endpoint.port);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    defineRoutes(app);

    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });

    callback(null, app);
}

function close(app, callback) {
    app.close(callback);
}

exports.create = create;
exports.close = close;