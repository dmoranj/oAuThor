"use strict";

var apps = require("../app"),
    request = require("request"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    tokens = require("../lib/tokenService"),
    should = require('should'),
    config = require("../config"),
    async = require("async"),
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    FAKED_SECRET,
    RESOURCE_OWNER = "TestResourceOwner",
    authorization,
    code,
    options,
    server;

describe("Authorization Code Grant", function () {
    beforeEach(function (done) {
        apps.create(function (error, createdServer) {
            clients.create(REDIRECT_URI, "testApp", "confidential", function (error, result) {
                CLIENT_ID = result.id;
                CLIENT_SECRET = result.secret;
                clients.create("http://fakedRedirection", "Faked App", "confidential", function (error, result) {
                    FAKED_CLIENT_ID = result.id;
                    FAKED_SECRET = result.secret;

                    done();
                });
            });

            server = createdServer;
        });
    });

    afterEach(function (done) {
        apps.close(server, function () {
            done();
        });
    });

    describe("When a grant request arrives", function () {
        beforeEach(function () {
            options = {
                url: 'https://localhost:' + config.endpoint.port + '/grant',
                method: 'POST',
                json: {
                    client_id: CLIENT_ID,
                    scope: SCOPE,
                    response_type: "code",
                    resource_owner: RESOURCE_OWNER
                },
                followRedirect: false
            };
        });

        it("should reject requests if the client does not exist", function (done) {
            options.json.client_id = "falseApp";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(404);
                done();
            });
        });

        it("should require the response type", function (done) {
            delete options.json.response_type;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should require a valid response type 'code' | 'token' ", function (done) {
            options.json.response_type = "falseType";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests if they don't have a scope", function (done) {
            delete options.json.scope;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should reject requests if the resource owner is not specified", function (done) {
            delete options.json.resource_owner;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should save the grant in the database", function (done) {
            request(options, function (err, response, body) {
                grants.find(options.json.client_id, function (error, grantList) {
                    should.not.exist(error);
                    grantList.length.should.equal(1);
                    done();
                });
            });
        });

        it("should redirect the client to the client Redirection URI with the access code", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(302);
                should.exist(response.headers.location);

                var parsedUrl = require("url").parse(response.headers.location, true);

                (parsedUrl.protocol + "//" + parsedUrl.host).should.equal(REDIRECT_URI);
                parsedUrl.query.code.should.match(/[0-9A-Fa-f\-]{36}/);

                done();
            });
        });

        it("should preserve the state from the original request in the redirection", function (done) {
            options.json.state = "InternalState";

            request(options, function (err, response, body) {
                var
                    parsedUrl = require("url").parse(response.headers.location, true);

                parsedUrl.query.state.should.equal("InternalState");
                done();
            });
        });
    });

    describe("When an authorization request arrives", function () {
        beforeEach(function (done) {
            config.tokens.expireTime = (24 * 60 * 60 * 1000);

            grants.add(CLIENT_ID, SCOPE, "code", RESOURCE_OWNER, function (err, result) {
                authorization = 'Basic ' + new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

                options = {
                    url: 'https://localhost:' + config.endpoint.port + '/token',
                    method: 'POST',
                    json: {
                        client_id: CLIENT_ID,
                        scope: SCOPE,
                        code: result.code,
                        client_secret: CLIENT_SECRET,
                        grant_type: "authorization_code"
                    },
                    headers: {
                        Authorization: authorization
                    },
                    followRedirect: false
                };

                done();
            });
        });

        it("should reject unauthenticated requests", function (done) {
            options.headers = null;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests without a valid code", function (done) {
            options.json.code = "Faked Code";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests with an expired code", function (done) {
            config.tokens.expireTime = -(60 * 60 * 1000);

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests witouht an appropriate type", function (done) {
            options.json.grant_type = "Faked type";

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should reject requests if the client_id does not match the one associated to the token", function (done) {
            options.json.client_id = FAKED_CLIENT_ID;
            options.headers.authorization = 'Basic ' + new Buffer(FAKED_CLIENT_ID + ':' + FAKED_SECRET).toString('base64');

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should return an access token and a refresh token when the code is valid", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.access_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.refresh_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.token_type.should.equal("bearer");
                should.exist(body.expires_in);
                done();
            });
        });

        it("should return both pragma and cache-control headers with no-cache value", function (done) {
            request(options, function (err, response, body) {
                response.headers['cache-control'].should.equal("no-store");
                response.headers.pragma.should.equal("no-cache");

                done();
            });
        });
    });

    describe("When a refresh request arrives", function () {
        beforeEach(function (done) {
            config.tokens.expireTime = (24 * 60 * 60 * 1000);

            grants.add(CLIENT_ID, SCOPE, "code", RESOURCE_OWNER, function (err, result) {
                tokens.get(CLIENT_ID, SCOPE, result.code, function (error, token) {
                    authorization = 'Basic ' + new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

                    options = {
                        url: 'https://localhost:' + config.endpoint.port + '/token',
                        method: 'POST',
                        json: {
                            scope: SCOPE,
                            client_id: CLIENT_ID,
                            grant_type: "refresh_token",
                            refresh_token: token.refresh_token,
                            client_secret: CLIENT_SECRET
                        },
                        followRedirect: false,
                        headers: {
                            Authorization: authorization
                        }
                    };

                    done();
                });
            });
        });

        it("should return a new authorization token when the refresh token is valid", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.access_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.refresh_token.should.match(/[0-9A-Fa-f\-]{36}/);
                body.token_type.should.equal("bearer");

                should.exist(body.expires_in);
                done();
            });
        });

        xit("should reject already used refresh tokens");
        xit("should reject invalid refresh tokens");

    });
});