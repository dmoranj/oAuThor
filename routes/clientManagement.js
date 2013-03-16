"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    series = async.series,
    apply = async.apply;

function checkParameter(param, message, req) {
    return function (callback) {
        var
            error = {};

        if (!req.body.hasOwnProperty(param)) {
            error.code = 400;
            error.message = message;
            callback(error);
        } else {
            callback(null);
        }
    };
}

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
        checkParameter("redirectUri", "Redirect URI missing", req),
        checkParameter("appName", "App Name missing", req),
        checkParameter("type", "Client type missing (confidential | public)", req),
        checkType(req)
    ], callback);
}

function renderCreate(req, res, err, results) {
    if (err) {
        res.send(err.code, err.message);
    } else {
        res.json(200, results[1]);
    }
}

exports.create = function (req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(clients.create, req.body.redirectUri, req.body.appName, req.body.type)
    ], apply(renderCreate, req, res));
};