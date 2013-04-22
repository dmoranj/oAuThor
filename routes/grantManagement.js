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
        utils.checkBody("client_id", "Client ID is missing", req),
        utils.checkBody("scope", "The scope is missing", req),
        utils.checkBody("resource_owner", "The resource owner is missing", req),
        utils.checkBody("response_type", "The response type ('code'|'token') is missing", req)
    ], callback);
}

function createGrant(req, res) {
    series([
        apply(checkCreateParameters, req),
        apply(grants.add, req.body.client_id, req.body.scope, req.body.response_type, req.body.resource_owner)
    ], apply(utils.render, req, res, 1, "redirection"));
}

exports.create = createGrant;