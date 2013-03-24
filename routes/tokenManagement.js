"use strict";

var
    async = require("async"),
    tokens = require("../lib/tokenService"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;

function checkCreateParameters(req, callback) {
    series([
        utils.checkBody("code", "Authorization code is missing", req),
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

function execTokenFunction(clientid, clientSecret, scope, code, type) {
    if (type == "authorization_code") {
        return apply(tokens.get, clientid, clientSecret, scope, code);
    } else if (type == "") {
        return apply(tokens.refresh, clientid, clientSecret, scope, code);
    } else {
        return function (callback) {
            var err = {
                code: 401,
                message: "Wrong grant type"
            };

            callback(err);
        };
    }
}

function getToken(req, res) {

    if (req.headers.authorization && req.headers.authorization.match(/Basic .*/)) {
        var
            credentials = utils.extract(req.headers.authorization);

        req.body.client_id = credentials[0];
        req.body.client_secret = credentials[1];
    }

    series([
        apply(checkCreateParameters, req),
        execTokenFunction(req.body.client_id, req.body.client_secret, req.body.scope, req.body.code, req.body.grant_type),
        apply(addHeaders, res)
    ], apply(utils.render, req, res, 1, "ok"));
}

exports.get = getToken;