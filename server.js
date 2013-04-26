"use strict";

var config = require("./config");

if (process.argv.length > 2) {
    var test = require(process.argv[2]);
    config.setConfig(test);
}

require("./app").create(function (error) {

});