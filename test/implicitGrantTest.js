"use strict";

var apps = require("../app"),
    mockResource = require("./resourceMock"),
    proxies = require("../" + process.env.LIB_ROOT + "/proxyService"),
    request = require("request"),
    clients = require("../" + process.env.LIB_ROOT + "/clientService"),
    grants = require("../" + process.env.LIB_ROOT + "/grantService"),
    tokens = require("../" + process.env.LIB_ROOT + "/tokenService"),
    routeUtils = require("../routes/routeUtils"),
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

describe("Implicit Grant", function () {
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
            authorization = 'Basic ' + new Buffer(RESOURCE_OWNER + ':' + RESOURCE_OWNER_PASS).toString('base64');

            optionsAuthorize = {
                url: 'https://localhost:' + config.endpoint.port + '/grant',
                method: 'POST',
                json: {
                    client_id: CLIENT_ID,
                    scope: SCOPE,
                    response_type: "token",
                    resource_owner: RESOURCE_OWNER
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

    describe("When a implicit grant request arrives", function () {
        it("should authenticate the resource owner", function (done) {
            delete optionsAuthorize.headers.Authorization;

            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should return an access token in the fragment", function (done) {
            request(optionsAuthorize, function (err, response, body) {
                response.statusCode.should.equal(302);
                
                var fragment = response.headers.location.match(/.*#(.*)/);
                should.exist(fragment[1]);

                var params = routeUtils.parse(fragment[1]);
                should.exist(params.access_token);
                params.access_token.should.match(/[0-9A-Fa-f\-]{36}/);

                done();
            });
        });

        it("should preserve the state from the original request in the redirection", function (done) {
            optionsAuthorize.json.state = "InternalState";

            request(optionsAuthorize, function (err, response, body) {
                var fragment = response.headers.location.match(/.*#(.*)/);
                should.exist(fragment[1]);

                var params = routeUtils.parse(fragment[1]);

                params.state.should.equal("InternalState");
                done();
            });
        });
    });
    describe("When a resource owner tries to access a resource", function () {
        it("should allow to access that resource owner's resources");
        it("should forbid access to other resource owner's resources");
    });
});