"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
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
        utils.check("scope", "The scope is missing", req),
        apply(checkIdExistance, req)
    ], callback);
}

function createGrant(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(grants.add, req.body.clientId, req.body.scope)
    ], apply(utils.render, req, res));
}

exports.create = createGrant;