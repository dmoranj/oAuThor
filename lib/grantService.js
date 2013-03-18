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
        if (grantList[i].clientId == clientId) {
            resultList.push(grantList[i]);
        }
    }

    callback(null, resultList);
}

function findGrantWithScope(clientId, scope, callback) {
    findGrant(clientId, function (err, grants) {
        if (err) {
            err.code = 404;
            err.message = "";
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

function generateCode() {
    return uuid.v4();
}

function addGrant(clientId, scope, callback) {
    clients.find(clientId, function (err, clientObject) {
        if (err || !clientObject) {
            callback(err);
        } else {
            var
                accessCode = generateCode();

            grantList.push({
                clientId: clientId,
                scope: scope,
                code: accessCode,
                creationTime: new Date().getTime()
            });

            var
                result = {
                    clientId: clientId,
                    code: accessCode,
                    redirectUri: clientObject.redirectUri
                };

            callback(null, result);
        }
    });
}

exports.find = findGrant;
exports.findWithScope = findGrantWithScope;
exports.add = addGrant;