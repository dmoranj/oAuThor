"use strict";

var
    mockResource = require("./resourceMock"),
    apps = require("../app"),
    proxies = require("../lib/proxyService"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    async = require('async'),
    apply = async.apply,
    series = async.series,
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    options,
    server,
    mockRes,
    proxy;

describe("Resource management", function () {

    beforeEach(function (done) {
        series([
            mockResource.createMockApp,
            proxies.create,
            apps.create,
            apply(clients.create, REDIRECT_URI, "testApp", "confidential")
        ], function (err, results) {
            mockRes = results[0];
            proxy = results[1];
            server = results[2];
            CLIENT_ID = results[3].id;
            CLIENT_SECRET = results[3].secret;

            grants.add(CLIENT_ID, SCOPE, function (error, results) {
                done();
            });
        });
    });

    describe("When a request for a protected resource arrives", function () {
        beforeEach(function (done) {
            options = {
                url: 'http://localhost:3000/grant',
                method: 'POST',
                json: {
                    clientId: CLIENT_ID,
                    scope: SCOPE
                }
            };

            done();
        });

        it("should reject requests without a valid token");

        it("should reject requests with a token without enough scope");
    });

    afterEach(function (done) {
        series([
            apply(apps.close, server),
            apply(proxies.close, proxy),
            apply(mockResource.close, mockRes)
        ], function (err, results) {
            if (err) {
                console.error("There was an error cleaning testing state");
            }

            done();
        });
    });
});