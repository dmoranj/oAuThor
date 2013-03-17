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
                code: accessCode
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
exports.add = addGrant;