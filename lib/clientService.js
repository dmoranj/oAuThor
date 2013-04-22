"use strict";

var uuid = require("node-uuid"),
    clientList = [];

function create(redirectUri, appName, type, callback) {
    var
        client = {
            id: uuid.v4(),
            secret: uuid.v4(),
            redirectUri: redirectUri,
            appName: appName,
            type: type
        };

    clientList.push(client);

    callback(null, client);
}

function listClients(callback) {
    callback(null, clientList);
}

function findClient(clientId, callback) {
    var
        i,
        result = null;

    for (i in clientList) {
        if (clientList[i].id == clientId) {
            result = clientList[i];
        }
    }

    if (result) {
        callback(null, result);
    } else {
        var
            error = {
                code: 404,
                message: "Client not found"
            };

        callback(error);
    }
}

function authenticate(clientId, clientSecret, callback) {
    findClient(clientId, function (error, client) {
        var result = null;

        if (error || !client || client.secret != clientSecret) {
            result = {
                code: 401,
                message: "Unauthenticated"
            };
        }

        callback(result);
    });
}

exports.create = create;
exports.list = listClients;
exports.find = findClient;
exports.authenticate = authenticate;