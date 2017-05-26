"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Client = undefined;

var _websocket = require("./lib/client/websocket.browser");

var _websocket2 = _interopRequireDefault(_websocket);

var _client = require("./lib/client");

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Client = exports.Client = (0, _client2.default)(_websocket2.default);