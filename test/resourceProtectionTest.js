"use strict";

var
    mockResource = require("./resourceMock"),
    apps = require("../app"),
    proxies = require("../" + process.env.LIB_ROOT + "/proxyService"),
    clients = require("../" + process.env.LIB_ROOT + "/clientService"),
    grants = require("../" + process.env.LIB_ROOT + "/grantService"),
    tokens = require("../" + process.env.LIB_ROOT + "/tokenService"),
    config = require("../config").config,
    request = require("request"),
    should = require('should'),
    async = require('async'),
    apply = async.apply,
    series = async.series,

    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/secure/*",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    TOKEN,
    FAKED_TOKEN = "alsdfoiajs9eufpasd9i",
    RESOURCE_OWNER = "TestResourceOwner",

    options,
    server,
    mockRes,
    proxy;

describe("Resource management", function () {

    beforeEach(function (done) {
        series([
            mockResource.createMockApp,
            apps.create,
            apply(clients.create, REDIRECT_URI, "testApp", "confidential")
        ], function (err, results) {
            mockRes = results[0];
            proxy = results[1][0];
            server = results[1][1];
            CLIENT_ID = results[2].id;
            CLIENT_SECRET = results[2].secret;

            grants.add(CLIENT_ID, SCOPE, "code", RESOURCE_OWNER, function (err, grant) {
                tokens.get(CLIENT_ID, SCOPE, grant.code, function (error, token) {
                    TOKEN = token.access_token;
                    done();
                });
            });
        });
    });

    describe("When a request for a protected resource arrives", function () {
        beforeEach(function (done) {
            options = {
                url: 'https://localhost:' + config.resource.proxy.port + "/api/" + RESOURCE_OWNER + "/secure",
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + TOKEN
                }
            };

            done();
        });

        it("should accept requests with the valid token", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);
                done();
            });
        });

        it("should reject requests without a token", function (done) {
            delete options.headers.Authorization;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests without a valid token", function (done) {
            options.headers.Authorization = "Bearer " + FAKED_TOKEN;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should return the authorization challenge header when unauthenticated", function (done) {
            delete options.headers.Authorization;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                should.exist(response.headers['www-authenticate']);
                (response.headers['www-authenticate']).should.match(/Bearer realm=.*/);
                done();
            });
        });

        it("should reject requests with a token without enough scope", function (done) {
            options.url = 'https://localhost:' + config.resource.proxy.port +  "/api/" + RESOURCE_OWNER + "/insecure";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(403);
                done();
            });
        });

        it("should reject request if the owner does not match the one who granted the authorization", function (done) {
            options.url = 'https://localhost:' + config.resource.proxy.port +  "/api/AnotherResourceOwner/secure";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(403);
                done();
            });
        });

        it("should decorate request headers with the detected resource owner", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);

                var parsedBody = JSON.parse(body);
                should.exist(parsedBody.request.headers);
                should.exist(parsedBody.request.headers.td_resourceowner);
                should.exist(parsedBody.request.headers.td_client);
                parsedBody.request.headers.td_resourceowner.should.equal(RESOURCE_OWNER);
                parsedBody.request.headers.td_client.should.equal(CLIENT_ID);
                done();
            });
        });

        it("should accept connections to the public resources", function (done) {
            options.url = 'https://localhost:' + config.resource.proxy.port +  "/public/resources";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);

                done();
            });
        });

        it("should reject requests with an outdated token");
    });

    afterEach(function (done) {
        series([
            apply(apps.close, server, proxy),
            apply(mockResource.close, mockRes)
        ], function (err, results) {
            if (err) {
                console.error("There was an error cleaning testing state");
            }

            done();
        });
    });
});