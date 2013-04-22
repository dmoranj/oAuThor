"use strict";

var apps = require("../app"),
    request = require("request"),
    clients = require("../lib/clientService"),
    grants = require("../lib/grantService"),
    tokens = require("../lib/tokenService"),
    config = require("../config"),
    should = require('should'),
    async = require("async"),
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    code,
    server,
    authorization;

describe("Client Credentials Grant", function () {
    var options;

    beforeEach(function (done) {
        apps.create(function (error, createdServer) {
            clients.create(REDIRECT_URI, "testApp", "confidential", function (error, result) {
                config.tokens.expireTime = (24 * 60 * 60 * 1000);
                CLIENT_ID = result.id;
                CLIENT_SECRET = result.secret;
                authorization = 'Basic ' + new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

                options = {
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

                server = createdServer;
                done();
            });
        });
    });

    afterEach(function (done) {
        apps.close(server, function () {
            done();
        });
    });

    describe("When an access token request arrives", function () {
        it("should check that the client is authenticated", function (done) {
            options.headers = null;

            request(options, function (err, response, body) {
                response.statusCode.should.equal(401);
                done();
            });
        });

        it("should grant an access token to access the client's own resources", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.access_token.should.match(/[0-9A-Fa-f\-]{36}/);
                should.not.exist(body.refresh_token);
                body.token_type.should.equal("bearer");
                should.exist(body.expires_in);
                done();
            });
        });

        it("should not allow the client to access other owner's resources");
    });
});