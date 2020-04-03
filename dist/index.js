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

var __rest = void 0 && (void 0).__rest || function (s, e) {
  var t = {};

  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  }

  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};

var Client = /*#__PURE__*/function (_CommonClient) {
  (0, _inherits2["default"])(Client, _CommonClient);

  function Client() {
    var address = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8080";

    var _a = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var generate_request_id = arguments.length > 2 ? arguments[2] : undefined;
    (0, _classCallCheck2["default"])(this, Client);

    var _a$autoconnect = _a.autoconnect,
        autoconnect = _a$autoconnect === void 0 ? true : _a$autoconnect,
        _a$reconnect = _a.reconnect,
        reconnect = _a$reconnect === void 0 ? true : _a$reconnect,
        _a$reconnect_interval = _a.reconnect_interval,
        reconnect_interval = _a$reconnect_interval === void 0 ? 1000 : _a$reconnect_interval,
        _a$max_reconnects = _a.max_reconnects,
        max_reconnects = _a$max_reconnects === void 0 ? 5 : _a$max_reconnects,
        rest_options = __rest(_a, ["autoconnect", "reconnect", "reconnect_interval", "max_reconnects"]);

    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Client).call(this, _websocket["default"], address, Object.assign({
      autoconnect: autoconnect,
      reconnect: reconnect,
      reconnect_interval: reconnect_interval,
      max_reconnects: max_reconnects
    }, rest_options), generate_request_id));
  }

  return Client;
}(_client["default"]);

exports.Client = Client;