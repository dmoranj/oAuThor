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
            access_token: uuid.v4(),
            token_type: "bearer",
            refresh_token: uuid.v4(),
            client_id: grant.client_id,
            scope: grant.scope,
            creationTime: new Date().getTime()
        };

    token.expires_in = token.creationTime + config.tokens.expireTime;

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

function newToken(grant, key, value, callback) {
    if (grant[key] == value) {
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

function tokenRetrieval(grantFindFunc, clientId, clientSecret, authField, authValue, callback) {
    async.series([
        grantFindFunc,
        async.apply(clients.find, clientId)
    ], function (error, data) {
        async.series([
            async.apply(checkError, error),
            async.apply(checkExpiration, data[0]),
            async.apply(checkSecret, data[1], clientSecret),
            async.apply(newToken, data[0], authField, authValue)
        ], function (error, result) {
            if (error) {
                callback(error);
            } else {
                callback(null, result[3]);
            }
        });
    });
}

function getToken(clientId, clientSecret, scope, code, callback) {
    tokenRetrieval(
        async.apply(grants.findWithScope, clientId, scope),
        clientId,
        clientSecret,
        "code",
        code,
        callback
    );
}

function getRefreshedToken(clientId, clientSecret, scope, refresh, callback) {
    tokenRetrieval(
        async.apply(findRefresh, refresh),
        clientId,
        clientSecret,
        "refresh_token",
        refresh,
        callback
    );
}

function find(key, value, callback) {
    var
        i,
        result = null;

    for (i in tokenList) {
        if (tokenList[i][key] == value && tokenList[i].creationTime + config.tokens.expireTime > new Date().getTime()) {
            result = tokenList[i];
        }
    }

    if (result) {
        callback(null, result);
    } else {
        var
            error = {
                code: 404,
                message: "Token not found"
            };

        callback(error);
    }
}

function findRefresh(refresh, callback) {
    find("refresh_token", refresh, callback);
}

function findToken(tokenValue, callback) {
    find("access_token", tokenValue, callback);
}

exports.refresh = getRefreshedToken;
exports.get = getToken;
exports.find = findToken;