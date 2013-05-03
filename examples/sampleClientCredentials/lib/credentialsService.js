"use strict";

var config = require("../config").config,
    request = require("request"),
    currentCredentials = null;


function getCredentials(callback) {
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
            currentCredentials = body;
            callback(null, body);
        }
    });
}

function getToken(callback) {
    var options = {
        url: "http://" + config.resourceServer.host + ":" + config.resourceServer.port + "/user/" + currentCredentials.id + "/diary",
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
            callback(body);
        }
    });
}

function getAuthorizationString() {
    return 'Basic ' + new Buffer(currentCredentials.id + ':' + currentCredentials.secret).toString('base64');
}

exports.getAuthorizationString = getAuthorizationString;
exports.getToken = getToken;
exports.getCredentials = getCredentials;