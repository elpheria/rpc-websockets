"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Server", {
  enumerable: true,
  get: function get() {
    return _server["default"];
  }
});
exports.Client = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _websocket = _interopRequireDefault(require("./lib/client/websocket"));

var _client = _interopRequireDefault(require("./lib/client"));

var _server = _interopRequireDefault(require("./lib/server"));

var Client =
/*#__PURE__*/
function (_CommonClient) {
  (0, _inherits2["default"])(Client, _CommonClient);

  function Client(address, options, generate_request_id) {
    (0, _classCallCheck2["default"])(this, Client);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Client).call(this, _websocket["default"], address, options, generate_request_id));
  }

  return Client;
}(_client["default"]);

exports.Client = Client;