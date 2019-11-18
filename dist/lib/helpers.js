"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getType = getType;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

/**
 * Returns string representation of type of passed object
 * @param {any} object - object to get type
 * @returns {string}
 */
function getType(object) {
  return object === null ? "null" : (0, _typeof2["default"])(object);
}