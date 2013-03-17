"use strict";

var
    async = require("async"),
    tokens = require("../lib/tokenService"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;

function checkCreateParameters(req, callback) {
    series([
        utils.check("code", "Authorization code is missing", req),
        utils.check("scope", "The authorization scope is missing", req),
        utils.check("clientId", "The client ID is missing", req)
    ], callback);
}

function getToken(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(tokens.get, req.body.clientId, req.body.scope, req.body.code)
    ], apply(utils.render, req, res, 1));
}

exports.get = getToken;