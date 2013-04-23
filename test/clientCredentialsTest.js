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
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    code,
    server,
    authorization,
    mockRes,
    proxy;

describe("Client Credentials Grant", function () {
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
                    grant_type: "client_credentials"
                },
                followRedirect: false,
                headers: {
                    Authorization: authorization
                }
            };

            optionsAccess = {
                url: 'https://localhost:' + config.resource.proxy.port + "/api/" + CLIENT_ID + "/secure",
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

    describe("When an access token request arrives", function () {
        it("should check that the client is authenticated", function (done) {
            optionsAuthorize.headers = null;

            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should grant an access token to access the client's own resources", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.access_token.should.match(/[0-9A-Fa-f\-]{36}/);
                should.not.exist(body.refresh_token);
                body.token_type.should.equal("bearer");
                should.exist(body.expires_in);
                done();
            });
        });

        it("should allow the client to access its own resources", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                optionsAccess.headers.Authorization = 'Bearer ' + body.access_token;
                request(optionsAccess, function (err, response, body) {
                    response.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it("should not allow the client to access other owner's resources", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                optionsAccess.headers.Authorization = 'Bearer ' + body.access_token;
                optionsAccess.url = 'https://localhost:' + config.resource.proxy.port + "/api/otherClientId/secure";
                request(optionsAccess, function (err, response, body) {
                    response.statusCode.should.equal(403);
                    done();
                });
            });
        });
    });
});