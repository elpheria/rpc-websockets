/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

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

var _ws = require("ws");

var _uuid = require("uuid");

var _uuid2 = _interopRequireDefault(_uuid);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _assertArgs = require("assert-args");

var _assertArgs2 = _interopRequireDefault(_assertArgs);

var _JsonRpcSocket = require("./JsonRpcSocket");

var _JsonRpcSocket2 = _interopRequireDefault(_JsonRpcSocket);

var _Namespace = require("./Namespace");

var _Namespace2 = _interopRequireDefault(_Namespace);

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Server = function (_EventEmitter) {
    (0, _inherits3.default)(Server, _EventEmitter);

    function Server() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        (0, _classCallCheck3.default)(this, Server);

        var _this = (0, _possibleConstructorReturn3.default)(this, (Server.__proto__ || (0, _getPrototypeOf2.default)(Server)).call(this));

        if (options.strict_notifications !== undefined && typeof options.strict_notifications !== "boolean") {
            var argType = (0, _helpers.getType)(options.strict_notifications);
            throw new TypeError("\"strict_notifications\" should be boolean, \"" + argType + "\" given");
        }

        if (options.idParam !== undefined && typeof options.idParam !== "string") {
            throw new TypeError("\"idParam\" should be a string, \"" + (0, _helpers.getType)(options.idParam) + "\" given");
        }

        if (typeof options.idParam === "string") {
            options.idParam = options.idParam.trim();
            if (options.idParam === "") {
                throw new TypeError("\"idParam\" can not be empty string");
            }
        }

        /**
         * Options of the server
         *
         * @type {object}
         */
        _this.options = (0, _assign2.default)({
            port: 0,
            strict_notifications: true,
            idParam: "socket_id"
        }, options);

        /**
         * Stores all connected sockets with a universally unique identifier
         * in the appropriate namespace.
         * Stores all rpc methods to specific namespaces. "/" by default.
         * Stores all events as keys and subscribed users in array as value
         * @private
         * @name _namespaces
         * @param {Object} namespaces.rpc_methods
         * @param {Map} namespaces.clients
         * @param {Object} namespaces.events
         */
        _this._namespaces = new _map2.default();

        /**
         * Stores all connected sockets as uuid => socket
         *
         * @type {Map<string|number, WebSocket>}
         *
         * @private
         */
        _this._sockets = new _map2.default();

        /**
         * Websocket server
         *
         * @type {WebSocketServer}
         */
        _this.wss = _this._startServer(_this.options);
        return _this;
    }

    /**
     * Start websocket server
     *
     * @param {object} options - websocket server options
     *
     * @returns {WebSocketServer}
     *
     * @private
     */


    (0, _createClass3.default)(Server, [{
        key: "_startServer",
        value: function _startServer(options) {
            var _this2 = this;

            var server = new _ws.Server(options);

            server.on("listening", function () {
                return _this2.emit("listening");
            });

            server.on("connection", function (socket, request) {
                _this2.emit("connection", socket, request);

                var u = _url2.default.parse(request.url, true);
                var ns = u.pathname;
                var id = u.query[_this2.options.idParam] || _uuid2.default.v1();

                // Create RPC wrapper for socket:
                var wrappedSocket = new _JsonRpcSocket2.default(socket, id);

                // Register socket and set it to some namespace:
                _this2._sockets.set(id, wrappedSocket);
                _this2.getOrCreateNamespace(ns).addClient(wrappedSocket);

                // Emit an event about RPC connection:
                _this2.emit("RPCConnection", wrappedSocket, request);

                // Clear socket data on delete:
                socket.on("close", function () {
                    return _this2._sockets.delete(id);
                });
            });

            server.on("error", function (error) {
                return _this2.emit("error", error);
            });

            return server;
        }

        /**
         * Closes the server and terminates all clients.
         * @method
         * @return {Promise}
         */

    }, {
        key: "close",
        value: function close() {
            var _this3 = this;

            return new _promise2.default(function (resolve, reject) {
                try {
                    _this3.wss.close(resolve);
                } catch (error) {
                    reject(error);
                }
            });
        }

        /* ----------------------------------------
         | RPC Sockets related methods
         |-----------------------------------------
         |
         |*/

        /**
         * Returns socket with given ID
         * @method
         * @param {string} id - socket id
         * @returns {JsonRPCSocket|null}
         */

    }, {
        key: "getRPCSocket",
        value: function getRPCSocket(id) {
            if (id === null || id === undefined || id === "") {
                throw new TypeError("No socket ID passed");
            }
            if (typeof id !== "string") {
                throw new TypeError("Expected Socket ID as number, " + (0, _helpers.getType)(id) + " passed");
            }
            return this._sockets.get(id) || null;
        }

        /* ----------------------------------------
         | Namespaces related methods
         |----------------------------------------
         |
         |*/

        /**
         * Creates namespace under given name
         * @method
         * @param {string} name - uuid of namespace
         * @returns {Namespace}
         */

    }, {
        key: "createNamespace",
        value: function createNamespace(name) {
            var _this4 = this;

            if (this.hasNamespace(name)) {
                throw new Error("Failed to create namespace: Namespace with name " + name + " already exists");
            }

            var ns = new _Namespace2.default(name, {
                strict_notifications: this.options.strict_notifications
            });
            this._namespaces.set(name, ns);
            // Handle notifications:
            ns.on("rpc:notification", function (notification, socket) {
                _this4.emit("rpc:notification", notification, socket, ns);
                _this4.emit("rpc:notification:" + notification.method, notification.params, socket, ns);
            });

            // Handle internal notifications:
            ns.on("rpc:internal:notification", function (notification, socket) {
                _this4.emit("rpc:internal:notification", notification, socket, ns);
                _this4.emit("rpc:internal:notification:" + notification.method, notification.params, socket, ns);
            });
            return ns;
        }

        /**
         * Check is namespace exists
         * @method
         * @param {String} name - namespace name
         * @returns {Boolean}
         */

    }, {
        key: "hasNamespace",
        value: function hasNamespace(name) {
            (0, _Namespace.assertNamespaceName)(name);
            return this._namespaces.has(name);
        }

        /**
         * Returns namespace with given name
         * @method
         * @param {string} name - uuid of namespace
         * @returns {Namespace|null}
         */

    }, {
        key: "getNamespace",
        value: function getNamespace(name) {
            (0, _Namespace.assertNamespaceName)(name);
            return this._namespaces.get(name) || null;
        }

        /**
         * Returns existing namespace or creates new and returns it
         * @method
         * @param {string} name - uuid of namespace
         * @returns {Namespace}
         */

    }, {
        key: "getOrCreateNamespace",
        value: function getOrCreateNamespace(name) {
            return this.hasNamespace(name) ? this.getNamespace(name) : this.createNamespace(name);
        }

        /**
         * Removes a namespace and closes all connections that belongs to it
         * @method
         * @param {String} name - namespace identifier
         * @throws {TypeError}
         * @return {Undefined}
         */

    }, {
        key: "closeNamespace",
        value: function closeNamespace(name) {
            if (this.hasNamespace(name)) {
                this.getNamespace(name).close();
                this._namespaces.delete(name);
            }
        }

        /**
         * Returns a requested namespace object
         * @method
         * @param {String} name - namespace identifier
         * @throws {TypeError}
         * @return {Object} - namespace object
         */

    }, {
        key: "of",
        value: function of(name) {
            return this.getOrCreateNamespace(name);
        }

        /* ----------------------------------------
         | RPC Notifications related methods
         |----------------------------------------
         |
         |*/
        /**
         * Change subscription status on given type of request
         *
         * @param {string} action - "on" "off" or "once"
         * @param {boolean} isInternal - subsribe to internal (true)
         *                               or normal (false) notification/request
         * @param {string|object} subscriptions - name of the method/notification
         *                                        or hash of name => handler
         * @param {function} handler? - required only if subscriptions is a string
         *
         * @returns {void}
         *
         * @private
         */

    }, {
        key: "_changeSubscriptionStatus",
        value: function _changeSubscriptionStatus(action, isInternal, subscriptions, handler) {
            var _this5 = this;

            if (typeof subscriptions === "string") subscriptions = (0, _defineProperty3.default)({}, subscriptions, handler);

            if (!subscriptions || (typeof subscriptions === "undefined" ? "undefined" : (0, _typeof3.default)(subscriptions)) !== "object" || Array.isArray(subscriptions)) throw new TypeError("Subsciptions is not a mapping of names to handlers");

            var eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification";
            (0, _entries2.default)(subscriptions).forEach(function (_ref) {
                var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
                    n = _ref2[0],
                    h = _ref2[1];

                (0, _Namespace.assertNotificationName)(n, isInternal);

                if (typeof h !== "function") throw new TypeError("Expected function as notification handler, got " + (0, _helpers.getType)(h));

                // Add "rpc." prefix for internal requests if omitted:
                if (isInternal && !n.startsWith("rpc.")) n = "rpc." + n;

                _this5[action](eventPrefix + ":" + n, h);
            });
        }

        /**
         * Creates a new notification that can be emitted to clients.
         *
         * @param {array|array<string>} names - notifications names
         * @param {String} ns? - namespace identifier
         *
         * @throws {TypeError}
         *
         * @return {Undefined}
         */

    }, {
        key: "registerNotification",
        value: function registerNotification(names) {
            var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

            return this.getOrCreateNamespace(ns).registerNotification(names);
        }

        /**
         * Unregister notification with given name as possible to be fired
         *
         * @param {array|array<string>} names - notifications names
         * @param {String} ns? - namespace identifier
         *
         * @returns {void}
         */

    }, {
        key: "unregisterNotification",
        value: function unregisterNotification(names) {
            var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

            if (!Array.isArray(names)) {
                names = [names];
            }
            names.forEach(_Namespace.assertNotificationName);

            if (this.hasNamespace(ns)) this.getNamespace(ns).unregisterNotification(names);
        }

        /**
         * Returns list of registered notification names
         *
         * @param {String} ns? - namespace identifier
         *
         * @returns {Array}
         */

    }, {
        key: "getRegisteredNotifications",
        value: function getRegisteredNotifications() {
            var ns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";

            return this.hasNamespace(ns) ? this.getNamespace(ns).getRegisteredNotifications() : [];
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
            return this._changeSubscriptionStatus("on", false, notification, handler);
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
            return this._changeSubscriptionStatus("once", false, notification, handler);
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
            return this._changeSubscriptionStatus("off", false, notification, handler);
        }

        /**
         * Send notification to all subscribed sockets
         *
         * @param {string} name - name of notification
         * @param {object|array} params? - notification parameters
         *
         * @returns {void}
         */

    }, {
        key: "sendNotification",
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(name, params) {
                var notificationsSent, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, namespace, sendProcess;

                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                (0, _Namespace.assertNotificationName)(name);

                                notificationsSent = [];
                                _iteratorNormalCompletion = true;
                                _didIteratorError = false;
                                _iteratorError = undefined;
                                _context.prev = 5;


                                for (_iterator = (0, _getIterator3.default)(this._namespaces.values()); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    namespace = _step.value;
                                    sendProcess = namespace.sendNotification(name, params);

                                    notificationsSent.push(sendProcess);
                                }

                                _context.next = 13;
                                break;

                            case 9:
                                _context.prev = 9;
                                _context.t0 = _context["catch"](5);
                                _didIteratorError = true;
                                _iteratorError = _context.t0;

                            case 13:
                                _context.prev = 13;
                                _context.prev = 14;

                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }

                            case 16:
                                _context.prev = 16;

                                if (!_didIteratorError) {
                                    _context.next = 19;
                                    break;
                                }

                                throw _iteratorError;

                            case 19:
                                return _context.finish(16);

                            case 20:
                                return _context.finish(13);

                            case 21:
                                return _context.abrupt("return", _promise2.default.all(notificationsSent));

                            case 22:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[5, 9, 13, 21], [14,, 16, 20]]);
            }));

            function sendNotification(_x5, _x6) {
                return _ref3.apply(this, arguments);
            }

            return sendNotification;
        }()

        /* ----------------------------------------
         | RPC internal Notifications related methods
         |----------------------------------------
         |
         |*/

        /**
         * Creates a new internal notification that can be emitted to clients.
         *
         * @param {array|array<string>} names - notifications names
         * @param {String} ns? - namespace identifier
         *
         * @throws {TypeError}
         *
         * @return {Undefined}
         */

    }, {
        key: "registerInternalNotification",
        value: function registerInternalNotification(names) {
            var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

            return this.getOrCreateNamespace(ns).registerInternalNotification(names);
        }

        /**
         * Unregister notification with given name as possible to be fired
         *
         * @param {array|array<string>} names - notifications names
         * @param {String} ns? - namespace identifier
         *
         * @returns {void}
         */

    }, {
        key: "unregisterInternalNotification",
        value: function unregisterInternalNotification(names) {
            var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

            if (this.hasNamespace(ns)) this.getNamespace(ns).unregisterInternalNotification(names);
        }

        /**
         * Returns list of registered internal notification names
         *
         * @param {String} ns? - namespace identifier
         *
         * @returns {Array}
         */

    }, {
        key: "getRegisteredInternalNotifications",
        value: function getRegisteredInternalNotifications() {
            var ns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";

            return this.hasNamespace(ns) ? this.getNamespace(ns).getRegisteredInternalNotifications() : [];
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
        key: "onInternalNotification",
        value: function onInternalNotification(notification, handler) {
            return this._changeSubscriptionStatus("on", true, notification, handler);
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
        key: "onceInternalNotification",
        value: function onceInternalNotification(notification, handler) {
            return this._changeSubscriptionStatus("once", true, notification, handler);
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
        key: "offInternalNotification",
        value: function offInternalNotification(notification, handler) {
            return this._changeSubscriptionStatus("off", true, notification, handler);
        }

        /**
         * Send notification to all subscribed sockets
         *
         * @param {string} name - name of notification
         * @param {object|array} params? - notification parameters
         *
         * @returns {void}
         */

    }, {
        key: "sendInternalNotification",
        value: function sendInternalNotification(name, params) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(this._namespaces.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var namespace = _step2.value;

                    namespace.sendInternalNotification(name, params);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }

        /* ----------------------------------------
         | RPC Methods related methods
         |----------------------------------------
         |
         |*/

        /**
         * Registers an RPC method
         *
         * @param {string} name - method name
         * @param {function} fn - method handler
         * @param {string} ns? - namespace name to register
         *
         * @returns {void}
         */

    }, {
        key: "registerMethod",
        value: function registerMethod(name, fn) {
            var ns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "/";

            this.getOrCreateNamespace(ns).registerMethod(name, fn, ns);
        }

        /**
         * Unregister an RPC method
         *
         * @param {string} name - method name
         * @param {string} ns? - namespace name to register
         *
         * @returns {void}
         */

    }, {
        key: "unregisterMethod",
        value: function unregisterMethod(name, ns) {
            if (this.hasNamespace(ns)) this.getNamespace(ns).unregisterMethod(name);
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
        key: "registerInternalMethod",
        value: function registerInternalMethod(name, fn) {
            var ns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "/";

            this.getOrCreateNamespace(ns).registerInternalMethod(name, fn, ns);
        }

        /**
         * Unregister an RPC method
         *
         * @param {string} name - method name
         * @param {string} ns? - namespace name to register
         *
         * @returns {void}
         */

    }, {
        key: "unregisterInternalMethod",
        value: function unregisterInternalMethod(name, ns) {
            if (this.hasNamespace(ns)) this.getNamespace(ns).unregisterInternalMethod(name);
        }

        /* ----------------------------------------
         | Deprecated methods & aliases
         |----------------------------------------
         |
         |*/

        /**
         * Registers an RPC method.
         * @method
         * @param {String} name - method name
         * @param {Function} fn - a callee function
         * @param {String} ns - namespace identifier
         * @throws {TypeError}
         * @return {Undefined}
         * @deprecated
         */

    }, {
        key: "register",
        value: function register(name, fn) {
            var ns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "/";

            (0, _assertArgs2.default)(arguments, {
                name: "string",
                fn: "function",
                "[ns]": "string"
            });

            this.getOrCreateNamespace(ns).register(name, fn);
        }

        /**
         * Creates a new event that can be emitted to clients.
         * @method
         * @param {String} name - event name
         * @param {String} ns - namespace identifier
         * @throws {TypeError}
         * @return {Undefined}
         * @deprecated
         */

    }, {
        key: "event",
        value: function event(name) {
            var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

            (0, _assertArgs2.default)(arguments, {
                "event": "string",
                "[ns]": "string"
            });

            this.getOrCreateNamespace(ns).event(name);
        }

        /**
         * Lists all created events in a given namespace. Defaults to "/".
         * @method
         * @param {String} ns - namespaces identifier
         * @readonly
         * @return {Array} - returns a list of created events
         * @deprecated
         */

    }, {
        key: "eventList",
        value: function eventList() {
            var ns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";

            return this.hasNamespace(ns) ? this.getNamespace(ns).eventList : [];
        }

        /**
         * Creates a JSON-RPC 2.0 compliant error
         * @method
         * @param {Number} code - indicates the error type that occurred
         * @param {String} message - provides a short description of the error
         * @param {String|Object} data - details containing additional information about the error
         * @return {Object}
         * @deprecated
         */

    }, {
        key: "createError",
        value: function createError(code, message, data) {
            (0, _assertArgs2.default)(arguments, {
                "code": "number",
                "message": "string",
                "[data]": ["string", "object"]
            });

            return {
                code: code,
                message: message,
                data: data || null
            };
        }
    }]);
    return Server;
}(_eventemitter2.default);

Server.RPCResponseTimeoutError = _JsonRpcSocket.TimeoutError;
Server.RPCServerError = _JsonRpcSocket.RPCServerError;
exports.default = Server;
module.exports = exports["default"];