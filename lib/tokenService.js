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
            client_id: grant.client_id,
            scope: grant.scope,
            resource_owner: grant.resource_owner,
            creationTime: new Date().getTime()
        };

    if (grant.type != "client_credentials") {
        token.refresh_token = uuid.v4();
    }

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

function checkClientId(grant, client, requestId, callback) {
    if (grant.client_id === client.id && client.id == requestId) {
        callback(null);
    } else {
        callback({
            code: 401,
            message: "Invalid client ID"
        });
    }
}

function tokenRetrieval(grantFindFunc, clientId, authField, authValue, callback) {
    async.series([
        grantFindFunc,
        async.apply(clients.find, clientId)
    ], function (error, data) {
        async.series([
            async.apply(checkError, error),
            async.apply(checkExpiration, data[0]),
            async.apply(checkClientId, data[0], data[1], clientId),
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

function getToken(clientId, scope, code, callback) {
    tokenRetrieval(
        async.apply(grants.findWithScope, clientId, scope),
        clientId,
        "code",
        code,
        callback
    );
}

function removeToken(key, value, callback) {
    var
        i = null,
        result = null;

    for (i in tokenList) {
        if (tokenList[i][key] == value && tokenList[i].creationTime + config.tokens.expireTime > new Date().getTime()) {
            result = i;
            break;
        }
    }

    if (i != null) {
        tokenList.splice(i, 1);
    }

    callback(null);
}

function getRefreshedToken(clientId, scope, refresh, callback) {
    async.series([
        async.apply(tokenRetrieval,
            async.apply(findRefresh, refresh),
            clientId,
            "refresh_token",
            refresh),
        async.apply(removeToken, "refresh_token", refresh)
    ], function (error, results) {
        if (error) {
            callback(error);
        } else {
            callback(null, results[0]);
        }
    });
}

function getClientCredentialsToken(clientId, callback) {
    tokenRetrieval(
        async.apply(grants.findWithClientCredentials, clientId),
        clientId,
        "type",
        "client_credentials",
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

function remove(tokenId, callback) {
    callback(null);
}

exports.remove = remove;
exports.getCcToken = getClientCredentialsToken;
exports.refresh = getRefreshedToken;
exports.get = getToken;
exports.find = findToken;