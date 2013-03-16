"use strict";

var
    request = require("request"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    async = require("async");

describe("Authorization Management", function () {
    beforeEach(function () {
        clients.create("http://redirecturi.com", "testApp", "confidential", function (error, result) {

        });
    });

    describe("When a grant request arrives", function () {
        var
            options;

        beforeEach(function (done) {
            clients.create("http://fakedredirect.com", "testApp", "confidential", function (err, client) {
                options = {
                    url: 'http://localhost:3000/grant',
                    method: 'POST',
                    json: {
                        clientId: client.id,
                        scope: "/stuff"
                    }
                };

                done();
            });
        });

        it("should reject requests if the client does not exist", function (done) {
            options.json.clientId = "falseApp";

            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(401);
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

        it("should return the redirection URI for the specified client, and the access code");
    });

    describe("When an authorization request arrives", function () {

        it("should reject requests without a valid code");

        it("should reject requests with an expired code");

        it("should reject requests if the clientId does not match the one associated to the token");

        it("should reject requests if the clientSecret does not correspond to that clientId");

        it("should return an authorization token and a refresh token when the code is valid");
    });

    describe("When a refresh request arrives", function () {
        it("should reject invalid refresh tokens");
        it("should return a new authorization token when the refresh token is valid");
    });
});