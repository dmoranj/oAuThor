"use strict";

var users = require("../lib/userService");

exports.create = function (req, res) {
    users.create(req.body.username, req.body.password, function(error, user) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, user);
        }
    });
};

exports.remove = function (req, res) {
    users.remove(req.params.userId, function (error) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, {});
        }
    });
};

exports.get = function (req, res) {
    users.get(req.params.userId, function (error, user) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, user);
        }
    });
};

exports.list = function (req, res) {
    users.list(function (error, list) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, list);
        }
    });
};

function extractCredentials(authHeader) {
    return new Buffer(authHeader.split(" ")[1], 'base64').toString('ascii').split(":");
}

exports.authenticate = function (req, res) {
    var credentials = extractCredentials(req.headers.authorization);

    users.authenticate(credentials[0], credentials[1], function (error) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, {});
        }
    });
}