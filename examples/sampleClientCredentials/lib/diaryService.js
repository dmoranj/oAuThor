"use strict";

var request = require("request"),
    credentials = require("./credentialsService"),
    utils = require("./connectionUtils"),
    config = require("../config").config;

function getDiaries(callback) {
    var options = {
        url: "http://" + config.resourceServer.host + ":" + config.resourceServer.port + "/user/"
            + credentials.credentials.client.id + "/diary",
        method: "GET"
    };

    credentials.withToken(options, utils.callback("getting diaries", callback));
}

function createDiary(callback) {
    var options = {
        url: "http://" + config.resourceServer.host + ":" + config.resourceServer.port + "/user/"
            + credentials.credentials.client.id + "/diary",
        method: "POST",
        json: {
        }
    };

    credentials.withToken(options, utils.callback("getting diaries", callback));
}

function getDiary(diaryId, callback) {
    var options = {
        url: "http://" + config.resourceServer.host + ":" + config.resourceServer.port + "/user/"
            + credentials.credentials.client.id + "/diary/" + diaryId,
        method: "GET"
    };

    credentials.withToken(options, utils.callback("getting diaries", callback));
}

exports.getDiaries = getDiaries;
exports.createDiary = createDiary;
exports.getDiary = getDiary;

credentials.initialize(function (error, data) {
    getDiaries(function (error, data) {
        console.log("Cua!");
    });
});