"use strict";

var
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
    grantList.push({
        clientId: clientId,
        scope: scope
    });

    callback(null);
}

exports.find = findGrant;
exports.add = addGrant;