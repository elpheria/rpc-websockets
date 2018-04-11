/**
 * WebSocket implements a browser-side WebSocket specification.
 * @module Client
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebSocket = function (_EventEmitter) {
    (0, _inherits3.default)(WebSocket, _EventEmitter);

    /** Instantiate a WebSocket class
     * @constructor
     * @param {String} address - url to a websocket server
     * @param {(Object)} options - websocket options
     * @param {(String|Array)} protocols - a list of protocols
     * @return {WebSocket} - returns a WebSocket instance
     */
    function WebSocket(address, options, protocols) {
        (0, _classCallCheck3.default)(this, WebSocket);

        var _this = (0, _possibleConstructorReturn3.default)(this, (WebSocket.__proto__ || (0, _getPrototypeOf2.default)(WebSocket)).call(this));

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
        _this.socket.onclose = function () {
            return _this.emit("close");
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


    (0, _createClass3.default)(WebSocket, [{
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
}(_eventemitter2.default);

exports.default = WebSocket;
module.exports = exports["default"];