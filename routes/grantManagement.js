"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;

function checkIdExistance(req, callback) {
    clients.find(req.body.clientId, function (err, client) {
        if (err) {
            err.code = 401;
            callback(err);
        } else {
            callback(null, client);
        }
    });
}

function checkCreateParameters(req, callback) {
    series([
        utils.check("clientId", "Client ID is missing", req),
        apply(checkIdExistance, req)
    ], callback);
}

function createGrant(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(clients.create, req.body.redirectUri, req.body.appName, req.body.type)
    ], apply(utils.render, req, res));
}

exports.create = createGrant;