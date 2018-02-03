/* A wrapper for the "qaap/uws-bindings" library. */

"use strict";

var _qaapUws = require("qaap-uws");

var _qaapUws2 = _interopRequireDefault(_qaapUws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (address, options) {
    return new _qaapUws2.default(address, options);
};