/* A wrapper for the "qaap/uws-bindings" library. */

"use strict";

var _ws = require("ws");

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (address, options) {
    return new _ws2.default(address, options);
};