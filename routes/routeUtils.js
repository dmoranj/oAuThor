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

function encodeQueryString(querySymbol, data) {
    var query = querySymbol;

    for (var i in data) {
        query+= i + "=" + data[i] + "&";
    }

    return query;
}

function parseQueryString(data) {
    return data.split("&").reduce(function(obj, item) {
        var attrs = item.split("=");
        obj[attrs[0]] = attrs[1];
        return obj;
        }, {});
}

function render(req, res, index, type, err, results) {
    if (err) {
        res.send(err.code, err.message);
    } else {
        if (type == "redirection") {
            var
                uri = results[index].redirectUri;

            delete results[index].redirectUri;

            if (req.body.state) {
                results[index].state = req.body.state;
            }

            if (req.body && req.body.response_type == "token") {
                res.redirect(302, uri + encodeQueryString("#", results[index]));
            } else {
                res.redirect(302, uri + encodeQueryString("?", results[index]));
            }
        } else if (type == "ok") {
            res.json(200, results[index]);
        } else {
            var error = {
                code: 500,
                message: "Internal error: unexpected render type"
            }
        }
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
exports.parse = parseQueryString;