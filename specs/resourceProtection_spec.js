"use strict";

var
    REDIRECT_URI = "http://redirecturi.com",
    SCOPE = "/stuff",
    CLIENT_ID,
    CLIENT_SECRET,
    FAKED_CLIENT_ID,
    options;

describe("Resource management", function () {
    describe("When a request for a protected resource arrives", function () {
        beforeEach(function (done) {
            options = {
                url: 'http://localhost:3000/grant',
                method: 'POST',
                json: {
                    clientId: CLIENT_ID,
                    scope: SCOPE
                }
            };

            done();
        });

        it("should reject requests without a valid token");

        it("should reject requests with a token without enough scope");
    });
});