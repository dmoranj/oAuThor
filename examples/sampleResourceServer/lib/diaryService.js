"use strict";

var uuid = require("node-uuid"),
    series = require("async").series,
    apply = require("async").apply,
    diaries = {};

function checkUser(userId, diaryId, callback) {
    if (!diaries[diaryId]) {
        callback({
            code: 404,
            message: "Diary not found"
        });
    } else if (diaries[diaryId].user == userId) {
        callback(null);
    } else {
        callback({
            code: 403,
            message: "Unauthorized access"
        });
    }
}

function fromCallback(callback, err, results) {
    if (err) {
        callback(err);
    } else {
        callback(null, results[1]);
    }
}

function get(userId, diaryId, callback) {
    var getAction = function(innerCallback) {innerCallback(null, diaries[diaryId]);}

    series([
        apply(checkUser, userId, diaryId),
        getAction
    ], apply(fromCallback, callback));
}

function create(userId, callback) {
    var diary = {
        id: uuid.v4(),
        user: userId,
        creation_time: new Date().getTime(),
        logs: []
    };

    diaries[diary.id] = diary;
    callback(null, diary);
}


function log(userId, diaryId, textToLog, callback) {
    var logAction = function (innerCallback) {
        diaries[diaryId].logs.push(textToLog);
        innerCallback(null, diaries[diaryId]);
    }

    series([
        apply(checkUser, userId, diaryId),
        logAction
    ], apply(fromCallback, callback));
}

function remove(userId, diaryId, callback) {

    var removeAction = function (innerCallback) {
        delete diaries[diaryId];
        callback(null);
    }

    series([
        apply(checkUser, userId, diaryId),
        removeAction
    ], apply(fromCallback, callback));
}

function list(userId, callback) {
    var result = [];

    for (var id in diaries) {
        if (diaries[id].user == userId) {
            result.push(diaries[id]);
        }
    }
    callback(null, result);
}

exports.get = get;
exports.create = create;
exports.log = log;
exports.remove = remove;
exports.list = list;