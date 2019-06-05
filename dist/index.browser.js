"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Client = void 0;

var _websocket = _interopRequireDefault(require("./lib/client/websocket.browser"));

var _client = _interopRequireDefault(require("./lib/client"));

var Client = (0, _client["default"])(_websocket["default"]);
exports.Client = Client;