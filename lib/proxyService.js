"use strict";

var http = require('http'),
    httpProxy = require('http-proxy'),
    config = require('../config'),
    tokens = require("./tokenService");

function authorize(req, callback) {
    if (req.headers && req.headers.authorization && req.headers.authorization.match(/Bearer.*/)) {
        var
            token = req.headers.authorization.split(" ")[1];

        tokens.find(token, function (error, resultToken) {
            if (error || !resultToken) {
                callback(false);
            } else {
                callback(true);
            }
        });

    } else {
        callback(false);
    }
}

function createProxy(callback) {
    var proxy = httpProxy.createServer(function (req, res, proxy) {
        authorize(req, function (tokenValid) {
            if (tokenValid) {
                proxy.proxyRequest(req, res, config.resource.original);
            } else {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.write(JSON.stringify({
                    message: 'Access forbidden'
                }));
                res.end();
            }
        });
    }).listen(config.resource.proxy.port);

    callback(null, proxy);
}

function close(proxy, callback) {
    proxy.close(callback);
}

exports.create = createProxy;
exports.close = close;
