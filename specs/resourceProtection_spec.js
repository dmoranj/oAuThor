"use strict";

var
    mockResource = require("./resourceMock"),
    apps = require("../app"),
    proxies = require("../lib/proxyService"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    tokens = require("../lib/tokenService"),
    config = require("../config"),
    request = require("request"),
    async = require('async'),
    apply = async.apply,
    series = async.series,

    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    TOKEN,
    FAKED_TOKEN = "alsdfoiajs9eufpasd9i",
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

            grants.add(CLIENT_ID, SCOPE, "code", function (err, grant) {
                tokens.get(CLIENT_ID, CLIENT_SECRET, SCOPE, grant.code, function (error, token) {
                    TOKEN = token.token;
                    done();
                });
            });
        });
    });

    describe("When a request for a protected resource arrives", function () {
        beforeEach(function (done) {
            options = {
                url: 'https://localhost:' + config.resource.proxy.port + "/secure",
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + TOKEN
                }
            };

            done();
        });

        it("should accept requests with the valid token", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(JSON.parse(body).secure).toEqual(true);
                done();
            });
        });

        it("should reject requests without a token", function (done) {
            delete options.headers.Authorization;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests without a valid token", function (done) {
            options.headers.Authorization = "Bearer " + FAKED_TOKEN;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should return the authorization challenge header when unauthenticated", function(done) {
            delete options.headers.Authorization;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                expect(response.headers['www-authenticate']).toBeDefined();
                expect(response.headers['www-authenticate']).toMatch(/Bearer realm=.*/);
                done();
            });
        })

        it("should reject requests with a token without enough scope");

        it("should reject requests with an expired token");
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