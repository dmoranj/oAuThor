"use strict";

var
    uuid = require("node-uuid"),
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

exports.create = create;
exports.list = listClients;