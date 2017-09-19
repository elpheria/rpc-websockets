/* A wrapper for the "uWebSockets/bindings" library. */

"use strict";

var _uws = require("uws");

var _uws2 = _interopRequireDefault(_uws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (address, options) {
    return new _uws2.default(address, options);
};