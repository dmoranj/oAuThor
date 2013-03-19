"use strict";

var http = require('http'),
    httpProxy = require('http-proxy'),
    config = require('../config');

function authorized(req) {
    return true;
}

function createProxy() {
    httpProxy.createServer(function (req, res, proxy) {
        if (authorized(req)) {
            proxy.proxyRequest(req, res, config.resource.original);
        } else {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.write('Access forbidden');
            res.end();
        }
    }).listen(config.resource.proxy.port);
}

exports.create = createProxy;
