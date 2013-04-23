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


describe("Resource Owner Credentials Grant", function () {
    describe("When a acess token request arrives", function () {
        it("should reject unauthenticated clients");
        it("should reject unauthenticated resource owners");
        it("should return an access token");
    });

    describe("When a resource owner tries to access a resource", function () {
        it("should allow to access that resource owner's resources");
        it("should forbid access to other resource owner's resources");
    });
});