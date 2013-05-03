'use strict';

var express = require('express'),
    http = require('http'),
    config = require('../config').config,
    globalPassword = "ResourcePassword";

function insecureRoute(req, res) {
    res.json(200, {
        message: "This content should be insecure",
        secure: false,
        public: false,
        request: {
            headers: req.headers
        }
    });
}

function secureRoute(req, res) {
    res.json(200, {
        message: "This content should be secure",
        secure: true,
        public: false,
        request: {
            headers: req.headers
        }
    });
}

function extractCredentials(authHeader) {
    return new Buffer(authHeader.split(" ")[1], 'base64').toString('ascii').split(":");
}

function login(req, res) {
    var credentials;

    if (req.headers && req.headers.authorization) {
        credentials = extractCredentials(req.headers.authorization);
    }

    if (credentials && credentials[1] && credentials[1] === globalPassword) {
        res.json(200, {});
    } else {
        res.json(401, {});
    }
}

function publicResources(req, res) {
    res.json(200, {
        message: "This content should be public",
        secure: false,
        public: true,
        request: {
            headers: req.headers
        }
    });
}

function defineMockRoutes(app) {
    app.get('/api/:ownerId/insecure', insecureRoute);
    app.get('/api/:ownerId/secure', secureRoute);
    app.post('/api/login', login);
    app.get('/public/resources', publicResources);
}

function createMockApp(callback) {
    var app = express(),
        server;

    app.configure(function () {
        app.set('port', config.resource.original.port);
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