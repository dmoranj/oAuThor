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

function refreshToken(grant, refresh, callback) {
    if (grant.refresh_token == refresh) {
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
    console.log("Getting token");

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

function findRefresh(clientId, scope, refresh, callback) {
    var
        i,
        result = null;

    for (i in tokenList) {
        if (tokenList[i].refresh_token == refresh && tokenList[i].creationTime + config.tokens.expireTime > new Date().getTime()) {
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

function getRefreshedToken(clientId, clientSecret, scope, refresh, callback) {
    console.log("Refreshing token");

    async.series([
        async.apply(findRefresh, clientId, scope, refresh),
        async.apply(clients.find, clientId)
    ], function (error, data) {
        async.series([
            async.apply(checkError, error),
            async.apply(checkExpiration, data[0]),
            async.apply(checkSecret, data[1], clientSecret),
            async.apply(refreshToken, data[0], refresh)
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
        if (tokenList[i].access_token == tokenValue && tokenList[i].creationTime + config.tokens.expireTime > new Date().getTime()) {
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

exports.refresh = getRefreshedToken;
exports.get = getToken;
exports.find = findToken;