"use strict";

var
    grants = require("./grantService"),
    uuid = require("node-uuid"),
    config = require("../config"),
    tokenList = [];

function generateToken(grant) {
    var
        token = {
            value: uuid.v4(),
            clientId: grant.clientId,
            scope: grant.scope,
            creationTime: new Date().getTime()
        };

    return token;
}

function getToken(clientId, scope, code, callback) {
    grants.findWithScope(clientId, scope, function (error, grant) {
        if (error) {
            callback(error);
        } else if (grant.creationTime + config.tokens.expireTime < new Date().getTime()) {
            var
                expireError = {
                    code: 401,
                    message: "Expired code"
                };

            callback(expireError);
        } else {
            if (grant.code == code) {
                callback(null, generateToken(grant));
            } else {
                var
                    err = {
                        code: 401,
                        message: "Invalid code"
                    };

                callback(err);
            }
        }
    });
}

exports.get = getToken;