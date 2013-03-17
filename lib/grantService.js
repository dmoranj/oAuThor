"use strict";

var
    clients = require("./clientService"),
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

function addGrant(clientId, scope, callback) {
    clients.find(clientId, function (err, clientObject) {
        if (err || !clientObject) {
            callback(err);
        } else {
            grantList.push({
                clientId: clientId,
                scope: scope
            });

            var
                result = {
                    clientId: clientId,
                    redirectUri: clientObject.redirectUri
                };

            callback(null, result);
        }
    });
}

exports.find = findGrant;
exports.add = addGrant;