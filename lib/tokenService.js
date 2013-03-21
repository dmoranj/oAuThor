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
            token: uuid.v4(),
            refresh: uuid.v4(),
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
    if (client.secret != clientSecret) {
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
        var
            token = generateToken(grant);

        tokenList.push(token);
        callback(null, token);
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
        ], function (error, result) {
            if (error) {
                callback(error);
            } else {
                callback(null, result[3]);
            }
        });
    });
}

function findToken(tokenValue, callback) {
    var
        i,
        result = null;

    for (i in tokenList) {
        if (tokenList[i].token == tokenValue && tokenList[i].creationTime + config.tokens.expireTime > new Date().getTime()) {
            result = tokenList[i];
        }
    }

    if (result) {
        callback(null, result);
    } else {
        var
            error = {
                code: 404,
                message: "Client not found"
            };

        callback(error);
    }
}

exports.get = getToken;
exports.find = findToken;