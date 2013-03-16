"use strict";

var
    request = require("request");

describe("Authorization Management", function () {

    describe("When a grant request arrives", function () {
        it("should reject requests for unexistent clients");

        it("should save the grant in the database");

        it("should return the redirection URI for the specified client, and the access code");
    });

    describe("When an authorization request arrives", function () {
        var
            options = {
                url: 'http://localhost:3000/identify',
                method: 'GET',
                json: {
                }
            };

        it("should reject requests without a valid code", function (done) {
            /*request(req, function(err, response, body) {
                expect(err).toBeNull();
                expect(response.statusCode).toEqual(200);

                done();
            });*/ done();
        });

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