"use strict";

var
    clients = require("./clientService"),
    uuid = require("node-uuid"),
    tokens = require("./tokenService"),
    async = require("async"),
    grantList = [];

function findGrant(clientId, criteria, callback) {
    var
        resultList = [],
        i;

    for (i in grantList) {
        if (grantList[i].client_id == clientId) {
            resultList.push(grantList[i]);
        }
    }

    if (criteria) {
        resultList = resultList.filter(criteria);
    }

    callback(null, resultList);
}

function resourceOwnerAndScopeFilter(scope, resourceOwner) {
    return function (value, index, coll) {
        return value.scope == scope & value.resource_owner == resourceOwner;
    };
}

function scopeFilter(scope) {
    return function (value, index, coll) {
        return value.scope == scope;
    };
}

function clientCredentialsFilter() {
    return function (value, index, coll) {
        return value.type == "client_credentials";
    };
}

/**
 * Find the client credentials grant of a given Client to access its own resources.
 * If the grant does not existe, it is created (a client can always access its own resources).
 *
 * @param clientId  The ID of the client.
 * @param callback
 */
function findWithCriteria(criteria, clientId, callback) {
    findGrant(clientId, criteria, function (err, grants) {
        if (err || !grants || !grants[0]) {
            var error = {};

            error.code = 404;
            error.message = "Client not found";
            callback(error);
        } else {
            callback(null, grants[0]);
        }
    });
}

function findGrantWithScope(clientId, scope, callback) {
    findWithCriteria(scopeFilter(scope), clientId, callback);
}

function findGrantWithScopeAndResourceOwner(clientId, scope, resourceOwner, callback) {
    findWithCriteria(resourceOwnerAndScopeFilter(scope, resourceOwner), clientId, callback);
}

function findWithClientCredentials(clientId, callback) {
    findWithCriteria(clientCredentialsFilter(), clientId, function(error, result) {
        if (!result) {
            var grant = {
                client_id: clientId,
                scope: "/",
                type: "client_credentials",
                resource_owner: clientId,
                creationTime: new Date().getTime()
            };

            grantList.push(grant);

            callback(null, grant);
        } else {
            callback(null, result);
        }
    });
}

function generateCode() {
    return uuid.v4();
}

function processCodeGrant(clientObject, grant, callback) {
    var accessCode = generateCode();

    grant.code = accessCode;

    var result = {
        client_id: grant.client_id,
        code: accessCode,
        redirectUri: clientObject.redirectUri
    };
    grantList.push(grant);
    callback(null, result);
}

function processPasswordGrant(clientObject, grant, callback) {
    var result = {
        client_id: grant.client_id,
        redirectUri: clientObject.redirectUri
    };
    grantList.push(grant);
    callback(null, result);
}

function processTokenGrant(clientObject, grant, callback) {
    grantList.push(grant);

    tokens.getImplicitToken(grant.client_id, grant.resource_owner, grant.scope, function (error, token) {
        if (error) {
            var error = {
                code: 401,
                message: "Error issuing token"
            };
        } else {
            callback(null, token);
        }
    });
}

function addGrant(clientId, scope, type, resourceOwner, callback) {
    clients.find(clientId, function (err, clientObject) {
        if (err || !clientObject) {
            callback(err);
        } else if (!type || (type != "code" && type != "password" && type != "token") ) {
            var error = {
                code: 401,
                message: "Unexpected grant type"
            };

            callback(error);
        } else {
            var grant = {
                    client_id: clientId,
                    scope: scope,
                    type: type,
                    resource_owner: resourceOwner,
                    creationTime: new Date().getTime()
                };

            if (type == "code") {
                processCodeGrant(clientObject, grant, callback);
            } else if (type == "password") {
                processPasswordGrant(clientObject, grant, callback);
            } else if (type == "token") {
                processTokenGrant(clientObject, grant, callback);
            }
        }
    });
}

exports.find = findGrant;
exports.findWithScope = findGrantWithScope;
exports.findGrantWithScopeAndResourceOwner = findGrantWithScopeAndResourceOwner;
exports.add = addGrant;
exports.findWithClientCredentials = findWithClientCredentials;