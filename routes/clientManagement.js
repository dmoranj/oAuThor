"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;


function checkType(req) {
    return function (callback) {
        if (req.body.type.match(/confidential|public/)) {
            callback(null);
        } else {
            var
                error = {};

            error.code = 400;
            error.message = "Type must be one of (confidential | public)";
            callback(error);
        }
    };
}

function checkCreateParameters(req, callback) {
    series([
        utils.check("redirectUri", "Redirect URI missing", req),
        utils.check("appName", "App Name missing", req),
        utils.check("type", "Client type missing (confidential | public)", req),
        checkType(req)
    ], callback);
}

exports.create = function (req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(clients.create, req.body.redirectUri, req.body.appName, req.body.type)
    ], apply(utils.render, req, res, 1));
};