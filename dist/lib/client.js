/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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

var _assertArgs = require("assert-args");

var _assertArgs2 = _interopRequireDefault(_assertArgs);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _circularJson = require("circular-json");

var _circularJson2 = _interopRequireDefault(_circularJson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (WebSocket) {
    return function (_EventEmitter) {
        (0, _inherits3.default)(Client, _EventEmitter);

        /**
         * Instantiate a Client class.
         * @constructor
         * @param {String} address - url to a websocket server
         * @param {Object} options - ws options object with reconnect parameters
         * @param {Function} generate_request_id - custom generation request Id
         * @return {Client}
         */
        function Client() {
            var address = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8080";

            var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                _ref$autoconnect = _ref.autoconnect,
                autoconnect = _ref$autoconnect === undefined ? true : _ref$autoconnect,
                _ref$reconnect = _ref.reconnect,
                reconnect = _ref$reconnect === undefined ? true : _ref$reconnect,
                _ref$reconnect_interv = _ref.reconnect_interval,
                reconnect_interval = _ref$reconnect_interv === undefined ? 1000 : _ref$reconnect_interv,
                _ref$max_reconnects = _ref.max_reconnects,
                max_reconnects = _ref$max_reconnects === undefined ? 5 : _ref$max_reconnects;

            var generate_request_id = arguments[2];
            (0, _classCallCheck3.default)(this, Client);

            var _this = (0, _possibleConstructorReturn3.default)(this, (Client.__proto__ || (0, _getPrototypeOf2.default)(Client)).call(this));

            _this.queue = {};
            _this.rpc_id = 0;

            _this.autoconnect = autoconnect;
            _this.ready = false;
            _this.reconnect = reconnect;
            _this.reconnect_interval = reconnect_interval;
            _this.max_reconnects = max_reconnects;
            _this.current_reconnects = 0;
            _this.generate_request_id = generate_request_id || function () {
                return ++_this.rpc_id;
            };

            if (_this.autoconnect) _this._connect(address, arguments[1]);
            return _this;
        }

        /**
         * Calls a registered RPC method on server.
         * @method
         * @param {String} method - RPC method name
         * @param {Object|Array} params - optional method parameters
         * @param {Number} timeout - RPC reply timeout value
         * @param {Object} ws_opts - options passed to ws
         * @return {Promise}
         */


        (0, _createClass3.default)(Client, [{
            key: "call",
            value: function call(method, params, timeout, ws_opts) {
                var _this2 = this;

                (0, _assertArgs2.default)(arguments, {
                    "method": "string",
                    "[params]": ["object", Array],
                    "[timeout]": "number",
                    "[ws_opts]": "object"
                });

                if (!ws_opts && "object" === (typeof timeout === "undefined" ? "undefined" : (0, _typeof3.default)(timeout))) {
                    ws_opts = timeout;
                    timeout = null;
                }

                return new _promise2.default(function (resolve, reject) {
                    if (!_this2.ready) return reject(new Error("socket not ready"));

                    var rpc_id = _this2.generate_request_id(method, params);

                    var message = {
                        jsonrpc: "2.0",
                        method: method,
                        params: params || null,
                        id: rpc_id
                    };

                    _this2.socket.send((0, _stringify2.default)(message), ws_opts, function (error) {
                        if (error) return reject(error);

                        _this2.queue[rpc_id] = { promise: [resolve, reject] };

                        if (timeout) {
                            _this2.queue[rpc_id].timeout = setTimeout(function () {
                                _this2.queue[rpc_id] = null;
                                reject(new Error("reply timeout"));
                            }, timeout);
                        }
                    });
                });
            }

            /**
             * Sends a JSON-RPC 2.0 notification to server.
             * @method
             * @param {String} method - RPC method name
             * @param {Object} params - optional method parameters
             * @return {Promise}
             */

        }, {
            key: "notify",
            value: function notify(method, params) {
                var _this3 = this;

                (0, _assertArgs2.default)(arguments, {
                    "method": "string",
                    "[params]": ["object", Array]
                });

                return new _promise2.default(function (resolve, reject) {
                    if (!_this3.ready) return reject(new Error("socket not ready"));

                    var message = {
                        jsonrpc: "2.0",
                        method: method,
                        params: params || null
                    };

                    _this3.socket.send((0, _stringify2.default)(message), function (error) {
                        if (error) return reject(error);

                        resolve();
                    });
                });
            }

            /**
             * Subscribes for a defined event.
             * @method
             * @param {String} event - event name
             * @return {Undefined}
             * @throws {Error}
             */

        }, {
            key: "subscribe",
            value: function () {
                var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(event) {
                    var result,
                        _args = arguments;
                    return _regenerator2.default.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    (0, _assertArgs2.default)(_args, {
                                        event: "string"
                                    });

                                    _context.next = 3;
                                    return this.call("rpc.on", [event]);

                                case 3:
                                    result = _context.sent;

                                    if (!(result[event] !== "ok")) {
                                        _context.next = 6;
                                        break;
                                    }

                                    throw new Error("Failed subscribing to an event '" + event + "' with: " + result[event]);

                                case 6:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));

                function subscribe(_x3) {
                    return _ref2.apply(this, arguments);
                }

                return subscribe;
            }()

            /**
             * Unsubscribes from a defined event.
             * @method
             * @param {String} event - event name
             * @return {Undefined}
             * @throws {Error}
             */

        }, {
            key: "unsubscribe",
            value: function () {
                var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(event) {
                    var result,
                        _args2 = arguments;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                        while (1) {
                            switch (_context2.prev = _context2.next) {
                                case 0:
                                    (0, _assertArgs2.default)(_args2, {
                                        event: "string"
                                    });

                                    _context2.next = 3;
                                    return this.call("rpc.off", [event]);

                                case 3:
                                    result = _context2.sent;

                                    if (!(result[event] !== "ok")) {
                                        _context2.next = 6;
                                        break;
                                    }

                                    throw new Error("Failed unsubscribing from an event with: " + result);

                                case 6:
                                case "end":
                                    return _context2.stop();
                            }
                        }
                    }, _callee2, this);
                }));

                function unsubscribe(_x4) {
                    return _ref3.apply(this, arguments);
                }

                return unsubscribe;
            }()

            /**
             * Closes a WebSocket connection gracefully.
             * @method
             * @param {Number} code - socket close code
             * @param {String} data - optional data to be sent before closing
             * @return {Undefined}
             */

        }, {
            key: "close",
            value: function close(code, data) {
                this.socket.close(code || 1000, data);
            }

            /**
             * Connection/Message handler.
             * @method
             * @private
             * @param {String} address - WebSocket API address
             * @param {Object} options - ws options object
             * @return {Undefined}
             */

        }, {
            key: "_connect",
            value: function _connect(address, options) {
                var _this4 = this;

                this.socket = new WebSocket(address, options);

                this.socket.on("open", function () {
                    _this4.ready = true;
                    _this4.emit("open");
                    _this4.current_reconnects = 0;
                });

                this.socket.on("message", function (message) {
                    if (message instanceof ArrayBuffer) message = Buffer.from(message).toString();

                    try {
                        message = _circularJson2.default.parse(message);
                    } catch (error) {
                        return;
                    }

                    // check if any listeners are attached and forward event
                    if (message.notification && _this4.listeners(message.notification).length) {
                        if (!(0, _keys2.default)(message.params).length) return _this4.emit(message.notification);

                        var args = [message.notification];

                        if (message.params.constructor === Object) args.push(message.params);else
                            // using for-loop instead of unshift/spread because performance is better
                            for (var i = 0; i < message.params.length; i++) {
                                args.push(message.params[i]);
                            }return _this4.emit.apply(_this4, args);
                    }

                    if (!_this4.queue[message.id]) {
                        // general JSON RPC 2.0 events
                        if (message.method && message.params) return _this4.emit(message.method, message.params);else return;
                    }

                    if (_this4.queue[message.id].timeout) clearTimeout(_this4.queue[message.id].timeout);

                    if (message.error) _this4.queue[message.id].promise[1](message.error);else _this4.queue[message.id].promise[0](message.result);

                    _this4.queue[message.id] = null;
                });

                this.socket.on("error", function (error) {
                    return _this4.emit("error", error);
                });

                this.socket.on("close", function (code, message) {
                    if (_this4.ready) _this4.emit("close", code, message);

                    _this4.ready = false;

                    if (code === 1000) return;

                    _this4.current_reconnects++;

                    if (_this4.reconnect && _this4.max_reconnects > _this4.current_reconnects || _this4.max_reconnects === 0) setTimeout(function () {
                        return _this4._connect(address, options);
                    }, _this4.reconnect_interval);
                });
            }
        }]);
        return Client;
    }(_eventemitter2.default);
};

module.exports = exports["default"];