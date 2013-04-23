'use strict';

var express = require('express'),
    clientRoutes = require('./routes/clientManagement'),
    grantRoutes = require('./routes/grantManagement'),
    tokenRoutes = require('./routes/tokenManagement'),
    proxies = require('./lib/proxyService'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),
    config = require('./config');

var options = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.certificate)
};

function defineRoutes(app) {
    app.post('/register', clientRoutes.create);
    app.post('/grant',
        grantRoutes.authenticate,
        grantRoutes.create);
    app.post('/token',
        clientRoutes.authenticate,
        tokenRoutes.get);
}

function create(callback) {
    var app = express(),
        server;

    app.configure(function () {
        app.set('port', process.env.PORT || config.endpoint.port);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        //app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    defineRoutes(app);

    server = https.createServer(options, app).listen(app.get('port'), function () {});

    proxies.create(config.resource.original.regex.resourceOwner,
        config.resource.original.regex.scope, function (error, proxy) {
            if (error) {
                console.error("Errror creating Proxy: " + error);
            } else {
                callback(null, server, proxy);
            }
        });
}

function close(server, proxy, callback) {
    server.close(function (err) {
        if (err) {
            callback(err);
        } else {
            proxy.close(callback);
        }
    });
}

exports.create = create;
exports.close = close;
