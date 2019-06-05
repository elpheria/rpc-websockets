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

var _websocket = _interopRequireDefault(require("./lib/client/websocket"));

var _client = _interopRequireDefault(require("./lib/client"));

var _server = _interopRequireDefault(require("./lib/server"));

var Client = (0, _client["default"])(_websocket["default"]);
exports.Client = Client;