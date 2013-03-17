"use strict";

function checkParameter(param, message, req) {
    return function (callback) {
        var
            error = {};

        if (!req.body.hasOwnProperty(param)) {
            error.code = 400;
            error.message = message;
            callback(error);
        } else {
            callback(null);
        }
    };
}

function render(req, res, index, err, results) {
    if (err) {
        res.send(err.code, err.message);
    } else {
        res.json(200, results[index]);
    }
}

exports.check = checkParameter;
exports.render = render;