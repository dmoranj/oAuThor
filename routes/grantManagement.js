"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    utils = require("./routeUtils"),
    series = async.series,
    apply = async.apply;

function checkCreateParameters(req, callback) {
    series([
        utils.check("client_id", "Client ID is missing", req),
        utils.check("scope", "The scope is missing", req)
    ], callback);
}

function createGrant(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(grants.add, req.body.client_id, req.body.scope)
    ], apply(utils.render, req, res, 1));
}

exports.create = createGrant;