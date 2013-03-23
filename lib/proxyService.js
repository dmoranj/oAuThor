"use strict";

var https = require('https'),
    httpProxy = require('http-proxy'),
    config = require('../config'),
    fs = require('fs'),
    tokens = require("./tokenService");

var options = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.certificate)
};

function authorize(req, callback) {
    if (req.headers && req.headers.authorization && req.headers.authorization.match(/Bearer.*/)) {
        var
            token = req.headers.authorization.split(" ")[1];

        tokens.find(token, function (error, resultToken) {
            if (error || !resultToken) {
                callback(false, 401);
            } else if (req.url.indexOf(resultToken.scope) != 0) {
                callback(false, 403);
            } else {
                callback(true);
            }
        });

    } else {
        callback(false, 401);
    }
}

function processRequest(req, res, proxy) {
    authorize(req, function (tokenValid, errorCode) {
        if (tokenValid) {
            proxy.proxyRequest(req, res);
        } else {
            res.writeHead(errorCode, {
                'Content-Type': 'text/plain',
                'WWW-Authenticate': 'Bearer realm=' + config.resource.original.realm
            });
            res.write(JSON.stringify({
                message: 'Access forbidden'
            }));
            res.end();
        }
    });
}

function createProxy(callback) {
    var proxy = new httpProxy.HttpProxy({
        target: config.resource.original
    });

    var server = https.createServer(options, function (req, res) {
        processRequest(req, res, proxy);
        //proxy.proxyRequest(req, res);
    }).listen(config.resource.proxy.port);

    callback(null, server);
}

function close(proxy, callback) {
    proxy.close(callback);
}

exports.create = createProxy;
exports.close = close;
