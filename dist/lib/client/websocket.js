/* A wrapper for the "qaap/uws-bindings" library. */
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _ws = _interopRequireDefault(require("ws"));

function _default(address, options) {
  return new _ws["default"](address, options);
}