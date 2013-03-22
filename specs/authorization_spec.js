"use strict";

var apps = require("../app"),
    request = require("request"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    config = require("../config"),
    async = require("async"),
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    code,
    options,
    server;

describe("Authorization Management", function () {
    beforeEach(function (done) {
        apps.create(function (error, createdServer) {
            clients.create(REDIRECT_URI, "testApp", "confidential", function (error, result) {
                CLIENT_ID = result.id;
                CLIENT_SECRET = result.secret;
                clients.create("http://fakedRedirection", "Faked App", "confidential", function (error, result) {
                    FAKED_CLIENT_ID = result.id;

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
                method: 'GET',
                qs: {
                    client_id: CLIENT_ID,
                    scope: SCOPE,
                    response_type: "code"
                },
                json: {},
                followRedirect: false
            };
        });

        it("should reject requests if the client does not exist", function (done) {
            options.qs.client_id = "falseApp";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(404);
                done();
            });
        });

        it("should require the response type", function(done) {
            delete options.qs.response_type;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should require a valid response type 'code' | 'token' ", function(done) {
            options.qs.response_type = "falseType";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests if they don't have a scope", function (done) {
            delete options.qs.scope;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should save the grant in the database", function (done) {
            request(options, function (err, response, body) {
                grants.find(options.qs.client_id, function (error, grantList) {
                    expect(error).toBeNull();
                    expect(grantList.length).toEqual(1);
                    done();
                });
            });
        });

        it("should redirect the client to the client Redirection URI with the access code", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(302);
                expect(response.headers.location).toBeDefined();
                var
                    parsedUrl = require("url").parse(response.headers.location, true);

                expect(parsedUrl.protocol + "//" + parsedUrl.host).toEqual(REDIRECT_URI);
                expect(parsedUrl.query.code).toMatch(/[0-9A-Fa-f\-]{36}/);

                done();
            });
        });

        it("should preserve the state from the original request in the redirection", function (done) {
            options.qs.state = "InternalState";

            request(options, function (err, response, body) {
                var
                    parsedUrl = require("url").parse(response.headers.location, true);

                expect(parsedUrl.query.state).toEqual("InternalState");
                done();
            });
        });
    });

    describe("When an authorization request arrives", function () {
        beforeEach(function (done) {
            config.tokens.expireTime = (24 * 60 * 60 * 1000);

            grants.add(CLIENT_ID, SCOPE, "code", function (err, result) {
                options = {
                    url: 'https://localhost:' + config.endpoint.port + '/token',
                    method: 'POST',
                    json: {
                        client_id: CLIENT_ID,
                        scope: SCOPE,
                        code: result.code,
                        client_secret: CLIENT_SECRET
                    },
                    followRedirect: false
                };

                done();
            });
        });

        it("should reject requests without a valid code", function (done) {
            options.json.code = "Faked Code";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests with an expired code", function (done) {
            config.tokens.expireTime = -(60 * 60 * 1000);

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests if the client_id does not match the one associated to the token", function (done) {
            options.json.client_id = FAKED_CLIENT_ID;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests if the client_secret does not correspond to that client_id", function (done) {
            options.json.client_secret = "Bad secret";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should allow requests with the authentication data in a BASIC authorization header", function (done) {
            delete options.json.client_secret;
            delete options.json.client_id;

            options.headers = {
                Authorization: 'Basic ' + new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
            }

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);
                done();
            });
        });

        it("should return an authorization token and a refresh token when the code is valid", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(body.access_token).toMatch(/[0-9A-Fa-f\-]{36}/);
                expect(body.refresh_token).toMatch(/[0-9A-Fa-f\-]{36}/);
                expect(body.token_type).toBe("bearer");
                expect(body.expires_in).toBeDefined();
                done();
            });
        });

        it("should return both pragma and cache-control headers with no-cache value", function (done) {
            request(options, function (err, response, body) {
                expect(response.headers['cache-control']).toEqual("no-store");
                expect(response.headers.pragma).toEqual("no-cache");

                done();
            });
        });
    });

    describe("When a refresh request arrives", function () {
        it("should reject invalid refresh tokens");
        it("should return a new authorization token when the refresh token is valid");
    });
});