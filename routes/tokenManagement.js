"use strict";

var
    async = require("async"),
    tokens = require("../lib/tokenService"),
    grants = require("../lib/grantService"),
    grantMgmt = require("./grantManagement"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;

function checkCreateParameters(req, callback) {
    series([
        utils.checkBody("grant_type", "Grant type is missing", req),
        utils.checkBody("scope", "The authorization scope is missing", req),
        utils.checkBody("client_id", "The client ID is missing", req)
    ], callback);
}

function addHeaders(res, callback) {
    res.set('cache-control', 'no-store');
    res.set('pragma', 'no-cache');

    callback(null);
}

function createUnauthenticatedFunction() {
    return function (callback) {
        var err = {
            code: 401,
            message: "Wrong grant type or arguments"
        };

        callback(err);
    };
}

function selectTokenFunction(clientid, clientSecret, scope, code, refresh, type, resourceOwner, resourceOwnerPassword, callback) {
    if (type == "authorization_code" && code) {
        callback(apply(tokens.get, clientid, scope, code));
    } else if (type == "refresh_token" && refresh) {
        callback(apply(tokens.refresh, clientid, scope, refresh));
    } else if (type == "client_credentials") {
        callback(apply(tokens.getCcToken, clientid));
    } else if (type == "password") {
        var authString = 'Basic ' + new Buffer(resourceOwner + ':' + resourceOwnerPassword).toString('base64');

        async.series([
            async.apply(grantMgmt.authenticate, authString),
            async.apply(grants.add, clientid, scope, "password", resourceOwner)
        ], function (error, results) {
            if (error) {
                callback(createUnauthenticatedFunction());
            } else {
                callback(apply(tokens.getRoToken, clientid, resourceOwner, scope));
            }
        });
    } else {
        callback(createUnauthenticatedFunction());
    }
}

function extractCredentials(req, res) {
    if (req.headers.authorization && req.headers.authorization.match(/Basic .*/)) {
        var
            credentials = utils.extract(req.headers.authorization);

        req.body.client_id = credentials[0];
        req.body.client_secret = credentials[1];
    }
}

function applyTokenFunction(req, res, tokenFunc) {
    series([
        apply(checkCreateParameters, req),
        tokenFunc,
        apply(addHeaders, res)
    ], apply(utils.render, req, res, 1, "ok"));
}

function getToken(req, res) {
    extractCredentials(req, res);

    selectTokenFunction(req.body.client_id,
            req.body.client_secret,
            req.body.scope,
            req.body.code,
            req.body.refresh_token,
            req.body.grant_type,
            req.body.username,
            req.body.password,
            apply(applyTokenFunction, req, res));
}

exports.get = getToken;