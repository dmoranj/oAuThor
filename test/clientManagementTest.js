"use strict";

var apps = require("../app"),
    request = require("request"),
    clients = require("../" + process.env.LIB_ROOT + "/clientService"),
    config = require('../config').config,
    should = require('should'),
    server,
    proxy;


describe("Client creation", function () {

    describe("When a new client request arrives", function () {
        var
            options;

        beforeEach(function (done) {
            apps.create(function (error, createdServer, createdProxy) {
                options = {
                    url: 'https://localhost:' + config.endpoint.port + '/register',
                    method: 'POST',
                    json: {
                        appName: 'testApp',
                        redirectUri: 'redirectUri',
                        type: 'confidential'
                    }
                };

                server = createdServer;
                proxy = createdProxy;
                done();
            });
        });

        afterEach(function (done) {
            apps.close(server, proxy, function () {
                done();
            });
        });

        it("should fail if the redirectUri is missing", function (done) {
            delete options.json.redirectUri;
            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should fail if the app name is missing", function (done) {
            delete options.json.appName;
            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should fail if the type is not present", function (done) {
            delete options.json.type;
            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });

        it("should fail if the type is not right", function (done) {
            options.json.type = "falsifiedType";
            request(options, function (err, response, body) {
                response.statusCode.should.equal(400);
                done();
            });
        });


        it("should return a clientId and a client_secret", function (done) {
            request(options, function (err, response, body) {
                response.statusCode.should.equal(200);
                body.id.should.match(/[0-9A-Fa-f\-]{36}/);
                body.secret.should.match(/[0-9A-Fa-f\-]{36}/);
                done();
            });
        });

        it("a client in the db is created", function (done) {
            clients.list(function (err, list) {
                should.not.exist(err);

                var
                    found = false,
                    i;

                for (i in list) {
                    if (list[i].appName == 'testApp') {
                        found = true;
                    }
                }

                should.exist(found);
                done();
            });
        });
    });
});
