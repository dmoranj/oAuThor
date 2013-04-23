"use strict";

var
    async = require("async"),
    tokens = require("../lib/tokenService"),
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

function execTokenFunction(clientid, clientSecret, scope, code, refresh, type) {
    if (type == "authorization_code" && code) {
        return apply(tokens.get, clientid, scope, code);
    } else if (type == "refresh_token" && refresh) {
        return apply(tokens.refresh, clientid, scope, refresh);
    } else if (type == "client_credentials") {
        return apply(tokens.getCcToken, clientid);
    } else {
        return function (callback) {
            var err = {
                code: 401,
                message: "Wrong grant type or arguments"
            };

            callback(err);
        };
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

function getToken(req, res) {
    extractCredentials(req, res);

    var
        tokenFunc = execTokenFunction(req.body.client_id,
            req.body.client_secret,
            req.body.scope,
            req.body.code,
            req.body.refresh_token,
            req.body.grant_type);

    series([
        apply(checkCreateParameters, req),
        tokenFunc,
        apply(addHeaders, res)
    ], apply(utils.render, req, res, 1, "ok"));
}

exports.get = getToken;