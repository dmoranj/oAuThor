"use strict";

function callback(msg, outerCallback) {
    return function (error, response, body) {
        if (error) {
            outerCallback(error);
        } else if (response.statusCode != 200) {
            outerCallback("Wrong status code " + msg + ": " + response.statusCode);
        } else {
            outerCallback(null, body);
        }
    };
}

exports.callback = callback;