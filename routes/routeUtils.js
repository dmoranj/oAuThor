"use strict";

function checkParameter(param, message, data) {
    return function (callback) {
        var
            error = {};

        if (!data.hasOwnProperty(param)) {
            error.code = 400;
            error.message = message;
            callback(error);
        } else {
            callback(null);
        }
    };
}

function checkQuery(param, message, req) {
    return checkParameter(param, message, req.query);
}

function checkBody(param, message, req) {
    return checkParameter(param, message, req.body);
}

function render(req, res, index, err, results) {
    if (err) {
        res.send(err.code, err.message);
    } else {
        res.json(200, results[index]);
    }
}

function extractCredentials(authHeader) {
    return new Buffer(authHeader.split(" ")[1], 'base64').toString('ascii').split(":");
}

exports.check = checkParameter;
exports.checkBody = checkBody;
exports.checkQuery = checkQuery;
exports.render = render;
exports.extract = extractCredentials;