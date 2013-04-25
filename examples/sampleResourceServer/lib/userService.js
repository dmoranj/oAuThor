"use strict";

var uuid = require("node-uuid"),
    users = {};

function get(userId, callback) {
    callback(null, users[userId]);
}

function create(userName, userPassword, callback) {
    var userId = uuid.v4();
    users[userId] = {
        id: userId,
        name: userName,
        password: userPassword
    };

    callback(null, users[userId]);
}

function remove(userId, callback) {
    delete users[userId];

    callback(null);
}

function list(callback) {
    callback(null, users);
}

exports.get = get;
exports.create = create;
exports.remove = remove;
exports.list = list;