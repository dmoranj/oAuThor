"use strict";

var config = require("../config").config,
    request = require("request"),
    async = require("async"),
    credentials = {
        resourceOwner: null,
        client: null
    };


function signUpAuthServer(callback) {
    var options = {
        url: "http://" + config.authServer.host + ":" + config.authServer.port + "/register",
        method: "POST",
        json: {
            "appName": "credentialServiceExample",
            "redirectUri": "http://localhost:3100/auth",
            "type": "confidential"
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.error("Something broken asking for credentials: " + error);
            callback(error);
        } else if (response.statusCode != 200) {
            console.error("Unexpected response from auth server: " + response.statusCode);
            callback(error);
        } else {
            credentials.client = body;
            callback(null, body);
        }
    });
}

function getToken(callback) {
    var options = {
        url: "http://" + config.authServer.host + ":" + config.authServer.port + "/token",
        method: "POST",
        json: {
            "scope": "/*",
            "grant_type": "client_credentials"
        },
        headers: {
            Authorization: getAuthorizationString()
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            callback(error);
        } else if (response.statusCode != 200) {
            callback("Unexpected status code getting token: " + response.statusCode);
        } else {
            callback(null, body);
        }
    });
}

function getAuthorizationString() {
    return 'Basic ' + new Buffer(credentials.client.id + ':' + credentials.client.secret).toString('base64');
}

function signUpOnResourceServer(callback) {
    var options = {
        url: "http://" + config.resourceServer.host + ":" + config.resourceServer.port + "/public/register",
        method: "POST",
        json: {
            username: credentials.client.id,
            password: "notReallyImportantPassword"
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            callback(error);
        } else if (response.statusCode != 200) {
            callback("Unexpected status signing up in the resource server: " + response.statusCode);
        } else {
            credentials.resourceOwner = body;
            callback(null, body);
        }
    });
}

function initialize(callback) {
    async.series([
        signUpAuthServer,
        signUpOnResourceServer
    ], callback);
}

function requestWithToken(options, callback) {
    getToken(function (error, token) {
        if (error) {
            callback(error);
        } else {
            if (!options.headers) {
                options.headers = {};
            }

            options.headers.Authorization = "Bearer " + token.access_token;
            request(options, callback);
        }
    });
}

exports.getAuthorizationString = getAuthorizationString;
exports.getToken = getToken;
exports.initialize = initialize;
exports.credentials = credentials;
exports.withToken = requestWithToken;