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
        utils.checkBody("scope", "The authorization scope is missing", req),
        utils.checkBody("client_id", "The client ID is missing", req)
    ], callback);
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
        apply(tokens.get, req.body.client_id, req.body.client_secret, req.body.scope, req.body.code)
    ], apply(utils.render, req, res, 1, "ok"));
}

exports.get = getToken;