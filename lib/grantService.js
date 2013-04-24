"use strict";

var
    clients = require("./clientService"),
    uuid = require("node-uuid"),
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
        }
    });
}

function generateCode() {
    return uuid.v4();
}

function addGrant(clientId, scope, type, resourceOwner, callback) {
    clients.find(clientId, function (err, clientObject) {
        if (err || !clientObject) {
            callback(err);
        } else if (!type || (type != "code" && type != "password") ) {
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
                },
                result;

            if (type == "code") {
                var accessCode = generateCode();

                grant.code = accessCode;

                result = {
                    client_id: clientId,
                    code: accessCode,
                    redirectUri: clientObject.redirectUri
                };
            } else if (type == "password") {
                result = {
                    client_id: clientId,
                    redirectUri: clientObject.redirectUri
                };
            }

            grantList.push(grant);
            callback(null, result);
        }
    });
}

exports.find = findGrant;
exports.findWithScope = findGrantWithScope;
exports.findGrantWithScopeAndResourceOwner = findGrantWithScopeAndResourceOwner;
exports.add = addGrant;
exports.findWithClientCredentials = findWithClientCredentials;