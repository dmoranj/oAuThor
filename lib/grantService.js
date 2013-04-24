"use strict";

var
    clients = require("./clientService"),
    uuid = require("node-uuid"),
    grantList = [];

function findGrant(clientId, callback) {
    var
        resultList = [],
        i;

    for (i in grantList) {
        if (grantList[i].client_id == clientId) {
            resultList.push(grantList[i]);
        }
    }

    callback(null, resultList);
}

function findGrantWithScope(clientId, scope, callback) {
    findGrant(clientId, function (err, grants) {
        if (err) {
            err.code = 404;
            err.message = "Client not found";
            callback(err);
        } else {
            var
                index,
                error = {};

            for (index in grants) {
                if (grants[index].scope == scope) {
                    callback(null, grants[index]);
                    return;
                }
            }

            error.code = 404;
            error.message = "";
            callback(error);
        }
    });
}

function findGrantWithScopeAndResourceOwner(clientId, scope, resourceOwner, callback) {
    findGrant(clientId, function (err, grants) {
        if (err) {
            err.code = 404;
            err.message = "Client not found";
            callback(err);
        } else {
            var
                index,
                error = {};

            for (index in grants) {
                if (grants[index].scope == scope & grants[index].resource_owner == resourceOwner) {
                    callback(null, grants[index]);
                    return;
                }
            }

            error.code = 404;
            error.message = "";
            callback(error);
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
        } else {

            if (type && type == "code") {
                var accessCode = generateCode();

                grantList.push({
                    client_id: clientId,
                    scope: scope,
                    code: accessCode,
                    type: type,
                    resource_owner: resourceOwner,
                    creationTime: new Date().getTime()
                });

                var
                    result = {
                        client_id: clientId,
                        code: accessCode,
                        redirectUri: clientObject.redirectUri
                    };

                callback(null, result);
            } else  if (type && type == "password") {

                grantList.push({
                    client_id: clientId,
                    scope: scope,
                    type: type,
                    resource_owner: resourceOwner,
                    creationTime: new Date().getTime()
                });

                var
                    result = {
                        client_id: clientId,
                        code: accessCode,
                        redirectUri: clientObject.redirectUri
                    };

                callback(null, result);
            } else {
                var
                    error = {
                        code: 401,
                        message: "Unexpected grant type"
                    };

                callback(error);
            }
        }
    });
}

/**
 * Find the client credentials grant of a given Client to access its own resources.
 * If the grant does not existe, it is created (a client can always access its own resources).
 *
 * @param clientId  The ID of the client.
 * @param callback
 */
function findWithClientCredentials(clientId, callback) {
    findGrant(clientId, function (err, grants) {
        if (err) {
            err.code = 404;
            err.message = "Client not found";
            callback(err);
        } else {
            var index,
                grant;

            for (index in grants) {
                if (grants[index].type == "client_credentials") {
                    callback(null, grants[index]);
                    return;
                }
            }

            grant = {
                client_id: clientId,
                scope: "/",
                type: "client_credentials",
                resource_owner: clientId,
                creationTime: new Date().getTime()
            };

            grants.push(grant);
            callback(null, grant);
        }
    });
}

exports.find = findGrant;
exports.findWithScope = findGrantWithScope;
exports.findGrantWithScopeAndResourceOwner = findGrantWithScopeAndResourceOwner;
exports.add = addGrant;
exports.findWithClientCredentials = findWithClientCredentials;