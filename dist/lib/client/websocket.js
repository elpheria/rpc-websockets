/* A wrapper for the "qaap/uws-bindings" library. */
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _ws = _interopRequireDefault(require("ws"));

module.exports = function (address, options) {
  return new _ws["default"](address, options);
};