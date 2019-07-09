/**
 * WebSocket implements a browser-side WebSocket specification.
 * @module Client
 */
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var WebSocket =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2["default"])(WebSocket, _EventEmitter);

  /** Instantiate a WebSocket class
   * @constructor
   * @param {String} address - url to a websocket server
   * @param {(Object)} options - websocket options
   * @param {(String|Array)} protocols - a list of protocols
   * @return {WebSocket} - returns a WebSocket instance
   */
  function WebSocket(address, options, protocols) {
    var _this;

    (0, _classCallCheck2["default"])(this, WebSocket);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(WebSocket).call(this));
    _this.socket = new window.WebSocket(address, protocols);

    _this.socket.onopen = function () {
      return _this.emit("open");
    };

    _this.socket.onmessage = function (event) {
      return _this.emit("message", event.data);
    };

    _this.socket.onerror = function (error) {
      return _this.emit("error", error);
    };

    _this.socket.onclose = function (event) {
      _this.emit("close", event.code, event.reason);
    };

    return _this;
  }
  /**
   * Sends data through a websocket connection
   * @method
   * @param {(String|Object)} data - data to be sent via websocket
   * @param {Object} options - ws options
   * @param {Function} callback - a callback called once the data is sent
   * @return {Undefined}
   */


  (0, _createClass2["default"])(WebSocket, [{
    key: "send",
    value: function send(data, options, callback) {
      callback = callback || options;

      try {
        this.socket.send(data);
        callback();
      } catch (error) {
        callback(error);
      }
    }
    /**
     * Closes an underlying socket
     * @method
     * @param {Number} code - status code explaining why the connection is being closed
     * @param {String} reason - a description why the connection is closing
     * @return {Undefined}
     * @throws {Error}
     */

  }, {
    key: "close",
    value: function close(code, reason) {
      this.socket.close(code, reason);
    }
  }]);
  return WebSocket;
}(_eventemitter["default"]);

exports["default"] = WebSocket;