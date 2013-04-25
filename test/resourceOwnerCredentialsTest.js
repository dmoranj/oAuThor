"use strict";

var apps = require("../app"),
    mockResource = require("./resourceMock"),
    proxies = require("../" + process.env.LIB_ROOT + "/proxyService"),
    request = require("request"),
    clients = require("../" + process.env.LIB_ROOT + "/clientService"),
    grants = require("../" + process.env.LIB_ROOT + "/grantService"),
    tokens = require("../" + process.env.LIB_ROOT + "/tokenService"),
    config = require("../config"),
    should = require('should'),
    async = require("async"),
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/secure",
    CLIENT_ID,
    CLIENT_SECRET,
    RESOURCE_OWNER = "TestResourceOwner",
    RESOURCE_OWNER_PASS = "ResourcePassword",
    code,
    server,
    authorization,
    mockRes,
    proxy;


describe("Resource Owner Credentials Grant", function () {
    var optionsAuthorize,
        optionsAccess;

    beforeEach(function (done) {
        async.series([
            mockResource.createMockApp,
            apps.create,
            async.apply(clients.create, REDIRECT_URI, "testApp", "confidential")
        ], function (err, results) {
            config.tokens.expireTime = (24 * 60 * 60 * 1000);
            mockRes = results[0];
            proxy = results[1][1];
            server = results[1][0];
            CLIENT_ID = results[2].id;
            CLIENT_SECRET = results[2].secret;
            authorization = 'Basic ' + new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

            optionsAuthorize = {
                url: 'https://localhost:' + config.endpoint.port + '/token',
                method: 'POST',
                json: {
                    scope: SCOPE,
                    grant_type: "password",
                    username: RESOURCE_OWNER,
                    password: RESOURCE_OWNER_PASS
                },
                followRedirect: false,
                headers: {
                    Authorization: authorization
                }
            };

            optionsAccess = {
                url: 'https://localhost:' + config.resource.proxy.port + "/api/" + RESOURCE_OWNER + "/secure",
                method: 'GET',
                headers: {
                }
            };

            done();
        });
    });

    afterEach(function (done) {
        async.series([
            async.apply(apps.close, server, proxy),
            async.apply(mockResource.close, mockRes)
        ], function (err, results) {
            if (err) {
                console.error("There was an error cleaning testing state");
            }

            done();
        });
    });

    describe("When a acess token request arrives", function () {
        it("should reject unauthenticated clients", function (done) {
            optionsAuthorize.headers = null;

            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject unauthenticated resource owners", function (done) {
            delete optionsAuthorize.json.username;
            delete optionsAuthorize.json.password;

            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should return an access token", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.access_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.refresh_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.token_type.should.equal("bearer");
                should.exist(body.expires_in);
                done();
            });
        });
    });

    describe("When a resource owner tries to access a resource", function () {
        it("should allow to access that resource owner's resources", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                optionsAccess.headers.Authorization = 'Bearer ' + body.access_token;
                request(optionsAccess, function (err, response, body) {
                    response.statusCode.should.equal(200);
                    done();
                });
            });
        });
        it("should forbid access to other resource owner's resources", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                optionsAccess.url = 'https://localhost:' + config.resource.proxy.port + "/api/FakedOwner/secure",
                optionsAccess.headers.Authorization = 'Bearer ' + body.access_token;
                request(optionsAccess, function (err, response, body) {
                    response.statusCode.should.equal(403);
                    done();
                });
            });
        });
    });
});