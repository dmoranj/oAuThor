"use strict";

var
    grants = require("./grantService"),
    clients = require("./clientService"),
    uuid = require("node-uuid"),
    config = require("../config"),
    async = require("async"),
    tokenList = [];

function generateToken(grant) {
    var
        token = {
            value: uuid.v4(),
            clientId: grant.clientId,
            scope: grant.scope,
            creationTime: new Date().getTime()
        };

    return token;
}

function checkError(error, callback) {
    if (error) {
        error.code = 401;
        error.message = "Client not found or grant mismatched.";
        callback(error);
    } else {
        callback(null);
    }
}

function checkExpiration(grant, callback) {
    if (grant.creationTime + config.tokens.expireTime < new Date().getTime()) {
        var
            expireError = {
                code: 401,
                message: "Expired code"
            };

        callback(expireError);
    } else {
        callback(null);
    }
}

function checkSecret(client, clientSecret, callback) {
    if (client.clientSecret != clientSecret) {
        var
            error = {
                code: 401,
                message: "Client not found or grant mismatched."
            };

        callback(error);
    } else {
        callback(null);
    }
}

function returnToken(grant, code, callback) {
    if (grant.code == code) {
        callback(null, generateToken(grant));
    } else {
        var
            err = {
                code: 401,
                message: "Invalid code"
            };

        callback(err);
    }

}

function getToken(clientId, clientSecret, scope, code, callback) {
    async.series([
        async.apply(grants.findWithScope, clientId, scope),
        async.apply(clients.find, clientId)
    ], function (error, data) {
        async.series([
            async.apply(checkError, error),
            async.apply(checkExpiration, data[0]),
            async.apply(checkSecret, data[1], clientSecret),
            async.apply(returnToken, data[0], code)
        ], callback);
    });
}

exports.get = getToken;