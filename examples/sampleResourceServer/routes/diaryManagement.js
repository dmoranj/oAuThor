"use strict";

var diaries = require("../lib/diaryService")

exports.create = function (req, res) {
    diaries.create(req.params.userId, function(error, diary) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, diary);
        }
    });
};

exports.remove = function (req, res) {
    diaries.remove(req.params.userId, req.params.diaryId, function(error) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, {});
        }
    });
};

exports.get = function (req, res) {
    diaries.get(req.params.userId, req.params.diaryId, function(error, diary) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, diary);
        }
    });
};

exports.log = function (req, res) {
    diaries.log(req.params.userId, req.params.diaryId, req.body.text, function(error, diary) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, diary);
        }
    });
};

exports.list = function (req, res) {
    diaries.list(req.params.userId, function(error, diaries) {
        if (error) {
            res.json(error.code, error);
        } else {
            res.json(200, diaries);
        }
    });
}
