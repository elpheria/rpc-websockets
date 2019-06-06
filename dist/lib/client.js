/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

var _Namespace = require("./Namespace");

var _Namespace2 = _interopRequireDefault(_Namespace);

var _JsonRpcSocket = require("./JsonRpcSocket");

var _JsonRpcSocket2 = _interopRequireDefault(_JsonRpcSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (WebSocket) {
    var _class, _temp;

    return _temp = _class = function (_EventEmitter) {
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
                max_reconnects = _ref$max_reconnects === undefined ? 5 : _ref$max_reconnects,
                _ref$strict_subscript = _ref.strict_subscriptions,
                strict_subscriptions = _ref$strict_subscript === undefined ? true : _ref$strict_subscript;

            var generate_request_id = arguments[2];
            (0, _classCallCheck3.default)(this, Client);

            var _this = (0, _possibleConstructorReturn3.default)(this, (Client.__proto__ || (0, _getPrototypeOf2.default)(Client)).call(this));

            _this.wsOptions = arguments[1];
            _this.options = {
                address: address,
                max_reconnects: max_reconnects,
                reconnect: reconnect,
                autoconnect: autoconnect,
                reconnect_interval: reconnect_interval,
                strict_subscriptions: strict_subscriptions,
                generate_request_id: generate_request_id
            };

            _this._ready = false;
            _this._currentReconnects = 0;
            _this._socket = null;
            _this._rpcSocket = null;
            _this._namespace = new _Namespace2.default("/", {
                strict_subscriptions: strict_subscriptions,
                // Client namespace should never use strict notifications, so client's events will
                // always be delivered to server:
                strict_notifications: false
            });

            if (_this.options.autoconnect) _this.connect();
            return _this;
        }

        /**
         * Connection/Message handler.
         * @method
         * @private
         * @param {String} address - WebSocket API address
         * @param {Object} options - ws options object
         * @return {Undefined}
         */


        (0, _createClass3.default)(Client, [{
            key: "_connect",
            value: function _connect(address, options) {
                var _this2 = this;

                var socket = new WebSocket(address, options);
                var rpcSocket = new _JsonRpcSocket2.default(socket, "main", {
                    generate_request_id: this.options.generate_request_id || null
                });

                rpcSocket.on("open", function () {
                    _this2._ready = true;
                    _this2.emit("open");
                    _this2._currentReconnects = 0;
                });

                rpcSocket.on("error", function (error) {
                    return _this2.emit("error", error);
                });

                rpcSocket.on("close", function (code, message) {
                    if (_this2._ready) _this2.emit("close", code, message);

                    _this2._ready = false;

                    if (code === 1000) return;

                    _this2._currentReconnects++;

                    if (_this2.options.reconnect && (_this2.options.max_reconnects > _this2._currentReconnects || _this2.options.max_reconnects === 0)) setTimeout(function () {
                        return _this2._connect(address, options);
                    }, _this2.options.reconnect_interval);
                });

                this._socket = socket;
                this._rpcSocket = rpcSocket;

                // Add socket to namespace:
                this._namespace.addClient(rpcSocket);
            }

            /**
             * Connects to a defined server if not connected already.
             * @method
             * @return {Undefined}
             */

        }, {
            key: "connect",
            value: function () {
                var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                    var _this3 = this;

                    return _regenerator2.default.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    return _context.abrupt("return", new _promise2.default(function (resolve, reject) {
                                        // Run new connection:
                                        if (!_this3._rpcSocket) _this3._connect(_this3.options.address, _this3.wsOptions);

                                        // If websocket is not in "OPENED" state then it's ready:
                                        if (_this3._rpcSocket.getSocket().readyState === 1) return resolve();
                                        // Otherwise wait till connection opened:
                                        else {
                                                _this3.once("open", resolve);
                                                _this3.once("error", reject);
                                            }
                                    }));

                                case 1:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));

                function connect() {
                    return _ref2.apply(this, arguments);
                }

                return connect;
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
                var _this4 = this;

                if (this._rpcSocket) {
                    var socket = this._rpcSocket.getSocket();
                    // If socket is connecting now - wait till connection establish and close it:
                    // (To prevent error "WebSocket was closed before the connection was established"):
                    if (socket.readyState === 0) {
                        this.once("open", function () {
                            return _this4.close(code, data);
                        });
                    }
                    // If socket is connected - close it. Otherwise do nothing:
                    else if (socket.readyState === 1) {
                            this._rpcSocket.close(code, data);
                        }
                }
            }

            /* ----------------------------------------
             | RPC Notifications related methods
             |----------------------------------------
             |
             |*/

        }, {
            key: "_updateSubscription",
            value: function () {
                var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(subscribe, events) {
                    var method;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                        while (1) {
                            switch (_context2.prev = _context2.next) {
                                case 0:
                                    if (typeof events === "string") events = [events];

                                    if (Array.isArray(events)) {
                                        _context2.next = 3;
                                        break;
                                    }

                                    return _context2.abrupt("return", _promise2.default.reject(new TypeError("Passed events list is not an array")));

                                case 3:
                                    if (this.options.strict_subscriptions) {
                                        _context2.next = 7;
                                        break;
                                    }

                                    return _context2.abrupt("return", events.reduce(function (result, event) {
                                        result[event] = "ok";
                                        return result;
                                    }, {}));

                                case 7:
                                    method = subscribe ? "on" : "off";
                                    _context2.next = 10;
                                    return this.callInternalMethod(method, events);

                                case 10:
                                    return _context2.abrupt("return", _context2.sent);

                                case 11:
                                case "end":
                                    return _context2.stop();
                            }
                        }
                    }, _callee2, this);
                }));

                function _updateSubscription(_x3, _x4) {
                    return _ref3.apply(this, arguments);
                }

                return _updateSubscription;
            }()

            /**
             * Subscribes for a defined event.
             * @method
             * @param {String|Array} event - event name
             * @return {Undefined}
             * @throws {Error}
             */

        }, {
            key: "subscribe",
            value: function () {
                var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(event) {
                    return _regenerator2.default.wrap(function _callee3$(_context3) {
                        while (1) {
                            switch (_context3.prev = _context3.next) {
                                case 0:
                                    return _context3.abrupt("return", this._updateSubscription(true, event));

                                case 1:
                                case "end":
                                    return _context3.stop();
                            }
                        }
                    }, _callee3, this);
                }));

                function subscribe(_x5) {
                    return _ref4.apply(this, arguments);
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
                var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(event) {
                    return _regenerator2.default.wrap(function _callee4$(_context4) {
                        while (1) {
                            switch (_context4.prev = _context4.next) {
                                case 0:
                                    return _context4.abrupt("return", this._updateSubscription(false, event));

                                case 1:
                                case "end":
                                    return _context4.stop();
                            }
                        }
                    }, _callee4, this);
                }));

                function unsubscribe(_x6) {
                    return _ref5.apply(this, arguments);
                }

                return unsubscribe;
            }()

            /**
             * Retrieve list of remote events
             *
             * @returns {Promise<array<string>>}
             */

        }, {
            key: "listRemoteEvents",
            value: function () {
                var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
                    return _regenerator2.default.wrap(function _callee5$(_context5) {
                        while (1) {
                            switch (_context5.prev = _context5.next) {
                                case 0:
                                    return _context5.abrupt("return", this._rpcSocket.listRemoteEvents());

                                case 1:
                                case "end":
                                    return _context5.stop();
                            }
                        }
                    }, _callee5, this);
                }));

                function listRemoteEvents() {
                    return _ref6.apply(this, arguments);
                }

                return listRemoteEvents;
            }()

            /**
             * Creates a new notification that can be emitted to clients.
             *
             * @param {String|array<string>} name - notification name
             *
             * @throws {TypeError}
             *
             * @return {Undefined}
             */

        }, {
            key: "registerNotification",
            value: function registerNotification(name) {
                return this._namespace.registerNotification(name);
            }

            /**
             * Unregister notification with given name as possible to be fired
             *
             * @param {string|array<string>} names - notifications names
             *
             * @returns {void}
             */

        }, {
            key: "unregisterNotification",
            value: function unregisterNotification(names) {
                return this._namespace.unregisterNotification(names);
            }

            /**
             * Returns list of registered notification names
             *
             * @returns {Array}
             */

        }, {
            key: "getRegisteredNotifications",
            value: function getRegisteredNotifications() {
                return this._namespace.getRegisteredNotifications();
            }

            /**
             * Set handlers for given RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "onNotification",
            value: function onNotification(notification, handler) {
                return this._namespace.onNotification(notification, handler);
            }

            /**
             * Set handlers for given RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "onceNotification",
            value: function onceNotification(notification, handler) {
                return this._namespace.onceNotification(notification, handler);
            }

            /**
             * Unsubscribe from given RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "offNotification",
            value: function offNotification(notification, handler) {
                return this._namespace.offNotification(notification, handler);
            }

            /**
             * Sends given notification
             *
             * @param {string} method - notification name
             * @param {object|array} params - notification parameters
             *
             * @returns {Promise}
             */

        }, {
            key: "sendNotification",
            value: function () {
                var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(method, params) {
                    return _regenerator2.default.wrap(function _callee6$(_context6) {
                        while (1) {
                            switch (_context6.prev = _context6.next) {
                                case 0:
                                    return _context6.abrupt("return", this._namespace.sendNotification(method, params));

                                case 1:
                                case "end":
                                    return _context6.stop();
                            }
                        }
                    }, _callee6, this);
                }));

                function sendNotification(_x7, _x8) {
                    return _ref7.apply(this, arguments);
                }

                return sendNotification;
            }()

            /* ----------------------------------------
             | RPC Internal Notifications related methods
             |----------------------------------------
             |
             |*/

            /**
             * Creates a new internal notification that can be emitted to clients.
             *
             * @param {string|array<string>} name - notification name
             *
             * @return {Undefined}
             */

        }, {
            key: "registerInternalNotification",
            value: function registerInternalNotification(name) {
                this._namespace.registerInternalNotification(name);
            }

            /**
             * Unregister notification with given name as possible to be fired
             *
             * @param {string|array<string>} names - notifications names
             *
             * @returns {void}
             */

        }, {
            key: "unregisterInternalNotification",
            value: function unregisterInternalNotification(names) {
                this._namespace.unregisterInternalNotification(names);
            }

            /**
             * Returns list of registered notification names
             *
             * @returns {Array}
             */

        }, {
            key: "getRegisteredInternalNotifications",
            value: function getRegisteredInternalNotifications() {
                return this._namespace.getRegisteredInternalNotifications();
            }

            /**
             * Subscribe to given internal RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "onInternalNotification",
            value: function onInternalNotification(notification, handler) {
                return this._namespace.onInternalNotification(notification, handler);
            }

            /**
             * Subscribe to given internal RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "onceInternalNotification",
            value: function onceInternalNotification(notification, handler) {
                return this._namespace.onceInternalNotification(notification, handler);
            }

            /**
             * Unsubscribe from given internal RPC notifications
             * Function have two signatures:
             *     - when notification and handler passed as two arguments
             *     - when list of notifications with related handlers are provided as javascript object
             *
             * @param {string|object} notification - notification name or hash of notification => handler
             * @param {function} handler? - notification handler (required if first argument is a string)
             *
             * @returns {void}
             */

        }, {
            key: "offInternalNotification",
            value: function offInternalNotification(notification, handler) {
                return this._namespace.offInternalNotification(notification, handler);
            }

            /**
             * Sends given notification
             *
             * @param {string} method - notification name
             * @param {object|array} params - notification parameters
             *
             * @returns {Promise}
             */

        }, {
            key: "sendInternalNotification",
            value: function () {
                var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(method, params) {
                    return _regenerator2.default.wrap(function _callee7$(_context7) {
                        while (1) {
                            switch (_context7.prev = _context7.next) {
                                case 0:
                                    return _context7.abrupt("return", this._namespace.sendInternalNotification(method, params));

                                case 1:
                                case "end":
                                    return _context7.stop();
                            }
                        }
                    }, _callee7, this);
                }));

                function sendInternalNotification(_x9, _x10) {
                    return _ref8.apply(this, arguments);
                }

                return sendInternalNotification;
            }()

            /* ----------------------------------------
             | RPC Methods related methods
             |----------------------------------------
             |
             |*/
            /**
             * Retrieve list of remote methods
             *
             * @returns {Promise<array<string>>}
             */

        }, {
            key: "listRemoteMethods",
            value: function () {
                var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
                    return _regenerator2.default.wrap(function _callee8$(_context8) {
                        while (1) {
                            switch (_context8.prev = _context8.next) {
                                case 0:
                                    return _context8.abrupt("return", this._rpcSocket.listRemoteMethods());

                                case 1:
                                case "end":
                                    return _context8.stop();
                            }
                        }
                    }, _callee8, this);
                }));

                function listRemoteMethods() {
                    return _ref9.apply(this, arguments);
                }

                return listRemoteMethods;
            }()

            /**
             * Registers an RPC method
             *
             * @param {string} name - method name
             * @param {function} fn - method handler
             *
             * @returns {void}
             */

        }, {
            key: "registerMethod",
            value: function registerMethod(name, fn) {
                this._namespace.registerMethod(name, fn);
            }

            /**
             * Unregister an RPC method
             *
             * @param {string} name - method name
             *
             * @returns {void}
             */

        }, {
            key: "unregisterMethod",
            value: function unregisterMethod(name) {
                this._namespace.unregisterMethod(name);
            }

            /**
             * Returns list of registered methods names
             *
             * @returns {Array<string>}
             */

        }, {
            key: "getRegisteredMethodsNames",
            value: function getRegisteredMethodsNames() {
                return this._namespace.getRegisteredMethodsNames();
            }

            /**
             * Call remote method
             * @param {string} method - method name to call
             * @param {object|array} params - parameters to pass in method
             * @param {number} waitTime? - max time to wait for response
             * @param {object} wsOptions? - websocket options
             * @returns {Promise<*>}
             */

        }, {
            key: "callMethod",
            value: function () {
                var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(method, params, waitTime, wsOptions) {
                    return _regenerator2.default.wrap(function _callee9$(_context9) {
                        while (1) {
                            switch (_context9.prev = _context9.next) {
                                case 0:
                                    return _context9.abrupt("return", this._rpcSocket.callMethod(method, params, waitTime, wsOptions));

                                case 1:
                                case "end":
                                    return _context9.stop();
                            }
                        }
                    }, _callee9, this);
                }));

                function callMethod(_x11, _x12, _x13, _x14) {
                    return _ref10.apply(this, arguments);
                }

                return callMethod;
            }()

            /* ----------------------------------------
             | RPC Internal Methods related methods
             |----------------------------------------
             |
             |*/

            /**
             * Registers an internal RPC method
             *
             * @param {string} name - method name
             * @param {function} fn - method handler
             * @param {string} ns? - namespace name to register
             *
             * @returns {void}
             */

        }, {
            key: "registerInternalMethod",
            value: function registerInternalMethod(name, fn) {
                return this._namespace.registerInternalMethod(name, fn);
            }

            /**
             * Registers an internal RPC method
             *
             * @param {string} name - method name
             * @param {function} fn - method handler
             * @param {string} ns? - namespace name to register
             *
             * @returns {void}
             */

        }, {
            key: "unregisterInternalMethod",
            value: function unregisterInternalMethod(name, fn) {
                return this._namespace.unregisterInternalMethod(name, fn);
            }

            /**
             * Returns list of registered internal methods
             *
             * @returns {Array<string>}
             */

        }, {
            key: "getRegisteredInternalMethodsNames",
            value: function getRegisteredInternalMethodsNames() {
                return this._namespace.getRegisteredInternalMethodsNames();
            }

            /**
             * Call remote method
             * @param {string} method - method name to call
             * @param {object|array} params - parameters to pass in method
             * @param {number} waitTime? - max time to wait for response
             * @param {object} wsOptions? - websocket options
             * @returns {Promise<*>}
             */

        }, {
            key: "callInternalMethod",
            value: function () {
                var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(method, params, waitTime, wsOptions) {
                    return _regenerator2.default.wrap(function _callee10$(_context10) {
                        while (1) {
                            switch (_context10.prev = _context10.next) {
                                case 0:
                                    return _context10.abrupt("return", this._rpcSocket.callInternalMethod(method, params, waitTime, wsOptions));

                                case 1:
                                case "end":
                                    return _context10.stop();
                            }
                        }
                    }, _callee10, this);
                }));

                function callInternalMethod(_x15, _x16, _x17, _x18) {
                    return _ref11.apply(this, arguments);
                }

                return callInternalMethod;
            }()

            /* ----------------------------------------
             | Deprecated methods
             |----------------------------------------
             |
             |*/
            /**
             * Calls a registered RPC method on server.
             * @method
             * @param {String} method - RPC method name
             * @param {Object|Array} params - optional method parameters
             * @param {Number} timeout - RPC reply timeout value
             * @param {Object} ws_opts - options passed to ws
             * @return {Promise}
             * @deprecated
             */

        }, {
            key: "call",
            value: function call(method, params, timeout, ws_opts) {
                (0, _assertArgs2.default)(arguments, {
                    "method": "string",
                    "[params]": ["object", Array],
                    "[timeout]": "number",
                    "[ws_opts]": "object"
                });

                if (method.startsWith("rpc.")) return this.callInternalMethod(method, params, timeout, ws_opts);else return this.callMethod(method, params, timeout, ws_opts);
            }

            /**
             * Fetches a list of client's methods registered on server.
             * @method
             * @return {Array}
             * @deprecated
             */

        }, {
            key: "listMethods",
            value: function () {
                var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11() {
                    return _regenerator2.default.wrap(function _callee11$(_context11) {
                        while (1) {
                            switch (_context11.prev = _context11.next) {
                                case 0:
                                    return _context11.abrupt("return", this.listRemoteMethods());

                                case 1:
                                case "end":
                                    return _context11.stop();
                            }
                        }
                    }, _callee11, this);
                }));

                function listMethods() {
                    return _ref12.apply(this, arguments);
                }

                return listMethods;
            }()

            /**
             * Sends a JSON-RPC 2.0 notification to server.
             * @method
             * @param {String} method - RPC method name
             * @param {Object} params - optional method parameters
             * @return {Promise}
             * @deprecated
             */

        }, {
            key: "notify",
            value: function () {
                var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(method, params) {
                    return _regenerator2.default.wrap(function _callee12$(_context12) {
                        while (1) {
                            switch (_context12.prev = _context12.next) {
                                case 0:
                                    if (!(typeof method !== "string")) {
                                        _context12.next = 2;
                                        break;
                                    }

                                    return _context12.abrupt("return", _promise2.default.reject(new TypeError("Notification name should be a string")));

                                case 2:
                                    if (!method.startsWith("rpc.")) {
                                        _context12.next = 6;
                                        break;
                                    }

                                    return _context12.abrupt("return", this._rpcSocket.sendInternalNotification(method, params));

                                case 6:
                                    return _context12.abrupt("return", this._rpcSocket.sendNotification(method, params));

                                case 7:
                                case "end":
                                    return _context12.stop();
                            }
                        }
                    }, _callee12, this);
                }));

                function notify(_x19, _x20) {
                    return _ref13.apply(this, arguments);
                }

                return notify;
            }()
        }]);
        return Client;
    }(_eventemitter2.default), _class.RPCResponseTimeoutError = _JsonRpcSocket.TimeoutError, _class.RPCServerError = _JsonRpcSocket.RPCServerError, _temp;
};

module.exports = exports["default"];