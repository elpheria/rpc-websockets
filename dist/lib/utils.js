"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultDataPack = void 0;
exports.createError = createError;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var errors = new Map([[-32000, "Event not provided"], [-32600, "Invalid Request"], [-32601, "Method not found"], [-32602, "Invalid params"], [-32603, "Internal error"], [-32604, "Params not found"], [-32605, "Method forbidden"], [-32606, "Event forbidden"], [-32700, "Parse error"]]);
var DefaultDataPack = /*#__PURE__*/function () {
  function DefaultDataPack() {
    (0, _classCallCheck2["default"])(this, DefaultDataPack);
  }
  (0, _createClass2["default"])(DefaultDataPack, [{
    key: "encode",
    value: function encode(value) {
      return JSON.stringify(value);
    }
  }, {
    key: "decode",
    value: function decode(value) {
      return JSON.parse(value);
    }
  }]);
  return DefaultDataPack;
}();
/**
 * Creates a JSON-RPC 2.0-compliant error.
 * @param {Number} code - error code
 * @param {String} details - error details
 * @return {Object}
 */
exports.DefaultDataPack = DefaultDataPack;
function createError(code, details) {
  var error = {
    code: code,
    message: errors.get(code) || "Internal Server Error"
  };
  if (details) error["data"] = details;
  return error;
}