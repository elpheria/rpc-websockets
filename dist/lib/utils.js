"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createError = undefined;

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = new _map2.default([[-32000, "Event not provided"], [-32600, "Invalid Request"], [-32601, "Method not found"], [-32602, "Invalid params"], [-32603, "Internal error"], [-32700, "Parse error"]]);

/**
 * Creates a JSON-RPC 2.0-compliant error.
 * @param {Number} code - error code
 * @param {String} details - error details
 * @return {Object}
 */
function createError(code, details) {
    var error = {
        code: code,
        message: errors.get(code) || "Internal Server Error"
    };

    if (details) error["data"] = details;

    return error;
}

exports.createError = createError;