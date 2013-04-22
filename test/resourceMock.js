'use strict';

var express = require('express'),
    http = require('http'),
    config = require('../config');

function insecureRoute(req, res) {
    res.json(200, {
        message: "This content should be insecure",
        secure: false
    });
}

function secureRoute(req, res) {
    res.json(200, {
        message: "This content should be secure",
        secure: true
    });
}

function defineMockRoutes(app) {
    app.get('/api/:ownerId/insecure', insecureRoute);
    app.get('/api/:ownerId/secure', secureRoute);
}

function createMockApp(callback) {
    var app = express(),
        server;

    app.configure(function () {
        app.set('port', config.resource.original.port);
        app.use(express.logger('dev'));
        app.use(express.methodOverride());
        app.use(app.router);
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    defineMockRoutes(app);

    server = http.createServer(app).listen(app.get('port'), function () {});

    callback(null, server);
}

function close(server, callback) {
    server.close(callback);
}

exports.createMockApp = createMockApp;
exports.close = close;