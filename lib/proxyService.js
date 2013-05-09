"use strict";

var https = require('https'),
    http = require('http'),
    httpProxy = require('http-proxy'),
    config = require('../config').config,
    fs = require('fs'),
    tokens = require("./tokenService"),
    options;

if (config.resource.proxy.ssl) {
    options = {
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.certificate)
    };
}

function authorize(req, owner, scope, callback) {
    if (req.headers && req.headers.authorization && req.headers.authorization.match(/Bearer.*/)) {
        var
            token = req.headers.authorization.split(" ")[1];

        tokens.find(token, function (error, resultToken) {
            if (error || !resultToken) {
                callback(false, 401);
            } else if (!scope.match(resultToken.scope)) {
                callback(false, 403);
            } else if (resultToken.resourceOwner && owner !== resultToken.resource_owner) {
                callback(false, 403);
            } else {
                req.headers.td_resourceowner = resultToken.resource_owner;
                req.headers.td_client = resultToken.client_id;
                callback(true);
            }
        });

    } else {
        callback(false, 401);
    }
}

function returnError(errorCode, res) {
    res.writeHead(errorCode, {
        'Content-Type': 'text/plain',
        'WWW-Authenticate': 'Bearer realm=' + config.resource.original.realm
    });
    res.write(JSON.stringify({
        message: 'Access forbidden'
    }));
    res.end();
}

function processRequest(req, res, proxy, owner, scope) {
    authorize(req, owner, scope, function (tokenValid, errorCode) {
        if (tokenValid) {
            proxy.proxyRequest(req, res);
        } else {
            returnError(errorCode, res);
        }
    });
}

function extractSecurityScope(ownerRE, scopeRE, path) {
    var matchOwner = path.match(ownerRE),
        matchScope = path.match(scopeRE);

    if (!path || !matchScope) {
        return null;
    } if (ownerRE && !matchOwner) {
        return null;
    } else {
        var result = {};

        if (ownerRE) {
            result.owner = path.match(ownerRE)[1];
        }

        if (scopeRE) {
            result.scope = path.match(scopeRE)[1];
        }

        return result;
    }
}

/**
 * Creates a proxy to protect a remote resource. Being protected by URL, remote resources
 * should give a Regular Expression to identify, only with its path, the resource owner id
 * of a given resource, and the scope the client is trying to acess.
 *
 * @param resourceOwnerRE Regular expression that returns the Resource Owner ID when applied to the path.
 * @param scopeRE Regular expression that returns the scope given a path.
 * @param publicRE Regular expression of the public resources (or null if there are none)
 * @param callback
 */
function createProxy(resourceOwnerRE, scopeRE, publicRE, callback) {
    var proxy = new httpProxy.HttpProxy({
        target: config.resource.original
    });

    var processingFunction = function (req, res) {
        if (publicRE && req.url.match(publicRE)) {
            proxy.proxyRequest(req, res);
        } else {
            var securityScope = extractSecurityScope(resourceOwnerRE, scopeRE, req.url);

            if (securityScope) {
                processRequest(req, res, proxy, securityScope.owner, securityScope.scope);
            } else {
                returnError(401, res);
            }
        }
    };

    var server;

    if (config.resource.proxy.ssl) {
        server = https.createServer(options, processingFunction).listen(config.resource.proxy.port);
    } else {
        server = http.createServer(processingFunction).listen(config.resource.proxy.port);
    }

    callback(null, server);
}

function close(proxy, callback) {
    proxy.close(callback);
}

exports.create = createProxy;
exports.close = close;
