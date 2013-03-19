"use strict";

var
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
    options;

describe("Authorization Management", function () {
    beforeEach(function () {
        clients.create(REDIRECT_URI, "testApp", "confidential", function (error, result) {
            CLIENT_ID = result.id;
            CLIENT_SECRET = result.secret;
            clients.create("http://fakedRedirection", "Faked App", "confidential", function (error, result) {
                FAKED_CLIENT_ID = result.id;
            });
        });
    });

    describe("When a grant request arrives", function () {
        beforeEach(function () {
            options = {
                url: 'http://localhost:3000/grant',
                method: 'POST',
                json: {
                    clientId: CLIENT_ID,
                    scope: SCOPE
                }
            };
        });

        it("should reject requests if the client does not exist", function (done) {
            options.json.clientId = "falseApp";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(404);
                done();
            });
        });

        it("should reject requests if they don't have a scope", function (done) {
            delete options.json.scope;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should save the grant in the database", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);

                grants.find(options.json.clientId, function (error, grantList) {
                    expect(error).toBeNull();
                    expect(grantList.length).toEqual(1);
                    done();
                });
            });
        });

        it("should return the redirection URI for the specified client, and the access code", function (done) {
            request(options, function (err, response, body) {
                expect(body.redirectUri).toEqual(REDIRECT_URI);
                expect(body.code).toMatch(/[0-9A-Fa-f\-]{36}/);

                done();
            });
        });
    });

    describe("When an authorization request arrives", function () {
        beforeEach(function (done) {
            config.tokens.expireTime = (24 * 60 * 60 * 1000);

            grants.add(CLIENT_ID, SCOPE, function (err, result) {
                options = {
                    url: 'http://localhost:3000/token',
                    method: 'GET',
                    json: {
                        clientId: CLIENT_ID,
                        scope: SCOPE,
                        code: result.code,
                        clientSecret: CLIENT_SECRET
                    }
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

        it("should reject requests if the clientId does not match the one associated to the token", function (done) {
            options.json.clientId = FAKED_CLIENT_ID;

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should reject requests if the clientSecret does not correspond to that clientId", function (done) {
            options.json.clientSecret = "Bad secret";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
                done();
            });
        });

        it("should return an authorization token and a refresh token when the code is valid", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(body.token).toMatch(/[0-9A-Fa-f\-]{36}/);
                expect(body.refresh).toMatch(/[0-9A-Fa-f\-]{36}/);
                done();
            });
        });
    });

    describe("When a refresh request arrives", function () {
        it("should reject invalid refresh tokens");
        it("should return a new authorization token when the refresh token is valid");
    });
});