"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

exports.getType = getType;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns string representation of type of passed object
 * @param {any} object - object to get type
 * @returns {string}
 */
function getType(object) {
  return object === null ? "null" : typeof object === "undefined" ? "undefined" : (0, _typeof3.default)(object);
}