"use strict";

var
    async = require("async"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    request = require("request"),
    utils = require("./routeUtils"),
    config = require("../config"),
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

/**
 * Authenticates the user against the Resource Server. To do so, the Authorization header is
 * used to build a simple login request to the login endpoint of the Resource Server. If the
 * login succeeds (Status code 200), the user is considered authenticated. Its authentication
 * is rejected otherwise.
 *
 * @param req
 * @param res
 */
function authenticate(authString, callback) {
    var options = {
        url: 'http://' + config.resource.original.host + ":" +
            config.resource.original.port + config.resource.original.loginPath,

        method: 'GET',
        headers: {}
    };

    if (authString) {
        options.headers.authorization = authString;
    }

    request(options, function (err, response, body) {
        if (err || response.statusCode != 200) {
            var error = {
                code: 401,
                message: "Unauthenticated"
            };

            callback(error);
        } else {
            callback(null);
        }
    });
}

/**
 * Express middleware to perform the authentication.
 *
 * @param req
 * @param res
 * @param next
 */
function authenticationMiddleware(req, res, next) {
    authenticate(req.headers.authorization, function(error) {
        if (error) {
            res.json(error.code, error);
        } else {
            next();
        }
    })
}

exports.create = createGrant;
exports.authenticate = authenticate;
exports.authenticateMid = authenticationMiddleware;