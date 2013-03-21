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
        utils.checkQuery("client_id", "Client ID is missing", req),
        utils.checkQuery("scope", "The scope is missing", req)
    ], callback);
}

function createGrant(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(grants.add, req.query.client_id, req.query.scope)
    ], apply(utils.render, req, res, 1));
}

exports.create = createGrant;