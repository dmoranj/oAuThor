"use strict";

var apps = require("../app"),
    request = require("request"),
    clients = require("../lib/clientService"),
    server;


describe("Client creation", function () {

    describe("When a new client request arrives", function () {
        var
            options;

        beforeEach(function (done) {
            apps.create(function (error, createdServer) {
                options = {
                    url: 'http://localhost:3000/register',
                    method: 'POST',
                    json: {
                        appName: 'testApp',
                        redirectUri: 'redirectUri',
                        type: 'confidential'
                    }
                };

                server = createdServer;
                done();
            });
        });

        afterEach(function (done) {
            apps.close(server, function () {
                done();
            });
        });

        it("should fail if the redirectUri is missing", function (done) {
            delete options.json.redirectUri;
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should fail if the app name is missing", function (done) {
            delete options.json.appName;
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should fail if the type is not present", function (done) {
            delete options.json.type;
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("should fail if the type is not right", function (done) {
            options.json.type = "falsifiedType";
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });


        it("should return a clientId and a client_secret", function (done) {
            request(options, function (err, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(body.id).toMatch(/[0-9A-Fa-f\-]{36}/);
                expect(body.secret).toMatch(/[0-9A-Fa-f\-]{36}/);
                done();
            });
        });

        it("a client in the db is created", function (done) {
            clients.list(function (err, list) {
                expect(err).toBeNull();

                var
                    found = false,
                    i;

                for (i in list) {
                    if (list[i].appName == 'testApp') {
                        found = true;
                    }
                }

                expect(found).toBeTruthy();
                done();
            });
        });
    });
});
