"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _from = require("babel-runtime/core-js/array/from");

var _from2 = _interopRequireDefault(_from);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

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

exports.assertNamespaceName = assertNamespaceName;

var _JsonRpcSocket = require("./JsonRpcSocket");

var _JsonRpcSocket2 = _interopRequireDefault(_JsonRpcSocket);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Function that validates namespace name
 * @param {string} name - name to validate
 * @throws TypeError if name is not valid
 * @returns {void1}
 */
function assertNamespaceName(name) {
    if (name === null || name === undefined || typeof name === "string" && name.trim().length === 0) {
        throw new TypeError("No namespace name is passed");
    }
    if (typeof name !== "string") throw new TypeError("Name of namespace should be a string, " + (0, _helpers.getType)(name) + " passed");
}

/**
 * Namespace class
 * @class
 */

var Namespace = function (_EventEmitter) {
    (0, _inherits3.default)(Namespace, _EventEmitter);

    function Namespace(name, options) {
        (0, _classCallCheck3.default)(this, Namespace);

        var _this = (0, _possibleConstructorReturn3.default)(this, (Namespace.__proto__ || (0, _getPrototypeOf2.default)(Namespace)).call(this));

        assertNamespaceName(name);

        _this.name = name;
        _this.options = (0, _assign2.default)({
            // Whether to send notifications to all connected sockets (false) or to only
            // subscribed sockets (true)
            strict_notifications: true
        }, options);

        _this._clients = new _set2.default();
        _this._requestsHandlers = new _map2.default();
        _this._notificationToSubscribers = new _map2.default();

        // Register internal methods:
        // TODO: was "__listMethods", renamed to "rpc.listMethods"
        _this.registerInternalMethod("listMethods", function () {
            return _this.getRegisteredMethodsNames();
        });
        _this.registerInternalMethod("listEvents", function () {
            return _this.getRegisteredNotifications();
        });
        _this.registerInternalMethod("on", function (notifications, socket) {
            return _this._updateRemoteSubscribers(true, notifications, socket);
        });
        _this.registerInternalMethod("off", function (notifications, socket) {
            return _this._updateRemoteSubscribers(false, notifications, socket);
        });
        return _this;
    }

    (0, _createClass3.default)(Namespace, [{
        key: "destruct",
        value: function destruct() {
            this._requestsHandlers.clear();
            delete this._requestsHandlers;
            this._notificationToSubscribers.clear();
            delete this._notificationToSubscribers;
            this._clients.clear();
            delete this._clients;
        }
    }, {
        key: "close",
        value: function close() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this.getClients()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var socket = _step.value;

                    socket.close();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.destruct();
        }

        /**
         * Handle incoming request
         *
         * @param {object} request - request object ("method" and "props")
         * @param {object} response - response object ("send", "throw" and "isSent")
         * @param {RPCSocket} socket - socket that received this request
         *
         * @returns {Promise<*>}
         *
         * @private
         */

    }, {
        key: "_handleRequest",
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(request, response, socket) {
                var requestHandler, result;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (this._requestsHandlers.has(request.method)) {
                                    _context.next = 3;
                                    break;
                                }

                                response.throw(_JsonRpcSocket.RPC_ERRORS.METHOD_NOT_FOUND);
                                return _context.abrupt("return");

                            case 3:
                                requestHandler = this._requestsHandlers.get(request.method);
                                result = void 0;
                                _context.prev = 5;
                                _context.next = 8;
                                return requestHandler(request.params, socket);

                            case 8:
                                result = _context.sent;
                                _context.next = 15;
                                break;

                            case 11:
                                _context.prev = 11;
                                _context.t0 = _context["catch"](5);

                                // If error signature was thrown ({error, message, data})
                                if (!(_context.t0 instanceof Error)) {
                                    if (typeof _context.t0.code === "undefined") response.throw(_JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR);else response.throw({
                                        code: _context.t0.code,
                                        message: _context.t0.message || _JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR.message
                                    }, _context.t0.data);
                                } else response.throw(_JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR, _context.t0.message);

                                return _context.abrupt("return");

                            case 15:

                                response.send(result);

                            case 16:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[5, 11]]);
            }));

            function _handleRequest(_x, _x2, _x3) {
                return _ref.apply(this, arguments);
            }

            return _handleRequest;
        }()

        /* ----------------------------------------
         | Client-related methods
         |----------------------------------------
         |
         |*/

    }, {
        key: "addClient",
        value: function addClient(socket) {
            var _this2 = this;

            if (!this.hasClient(socket)) {
                if (!(socket instanceof _JsonRpcSocket2.default)) throw new Error("Socket should be an instance of RPCSocket");

                this._clients.add(socket);

                // cleanup after the socket gets disconnected:
                socket.on("close", function () {
                    return _this2.removeClient(socket);
                });

                // Handle notifications:
                socket.on("rpc:notification", function (notification) {
                    _this2.emit("rpc:notification", notification, socket);
                    _this2.emit("rpc:notification:" + notification.method, notification.params, socket);
                });

                // Handle internal notifications:
                socket.on("rpc:internal:notification", function (notification) {
                    _this2.emit("rpc:internal:notification", notification, socket);
                    _this2.emit("rpc:internal:notification:" + notification.method, notification.params, socket);
                });

                // Handle requests on socket:
                socket.on("rpc:request", this._handleRequest, this);

                // Handle various internal requests on socket:
                socket.on("rpc:internal:request", this._handleRequest, this);
            }
            return this;
        }
    }, {
        key: "removeClient",
        value: function removeClient(socket) {
            this._clients.delete(socket);
            this._notificationToSubscribers.forEach(function (subscribers) {
                return subscribers.delete(socket);
            });
        }
    }, {
        key: "hasClient",
        value: function hasClient(socketOrId) {
            var socket = typeof socketOrId === "string" ? this.getClient(socketOrId) : socketOrId;
            return this._clients.has(socket);
        }
    }, {
        key: "getClients",
        value: function getClients() {
            return this._clients.values();
        }
    }, {
        key: "getClient",
        value: function getClient(id) {
            var result = null;

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(this._clients), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var client = _step2.value;

                    if (client.getId() === id) {
                        result = client;
                        break;
                    }
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

            return result;
        }

        /* ----------------------------------------
         | Notifications related methods
         |----------------------------------------
         |
         |*/

        /**
         * Adds or removes given notifications from list of notifications that is possible to send
         *
         * @param {boolean} shouldBeAdded - true to add, false to remove given notifications
         * @param {boolean} isInternal - true to add internal notifications
         * @param {array|string} names - list of names to add or one single name
         *
         * @returns {void}
         *
         * @private
         */

    }, {
        key: "_changeNotificationPresence",
        value: function _changeNotificationPresence(shouldBeAdded, isInternal, names) {
            var _this3 = this;

            if (!Array.isArray(names)) names = [names];

            names.forEach(function (name) {
                if (typeof name !== "string" || name.trim().length === 0) throw new Error("Notification name should be non-empty string, " + (typeof name === "undefined" ? "undefined" : (0, _typeof3.default)(name)) + " passed");

                if (!isInternal && name.startsWith("rpc.")) throw new Error("Notifications with prefix \"rpc.\" is for internal usage only" + "use methods \"registerInternalNotification\" and" + "\"unregisterInternalNotification\" to register such notification names");
                if (isInternal && !name.startsWith("rpc.")) name = "rpc." + name;

                if (shouldBeAdded) {
                    if (!_this3._notificationToSubscribers.has(name)) _this3._notificationToSubscribers.set(name, new _set2.default());
                } else _this3._notificationToSubscribers.delete(name);
            });
        }

        /**
         * Adds or removes remote socket from listening notification on this namespace
         *
         * @param {boolean} add - true to add and false to delete
         * @param {Array<string>} notifications - array of notifications
         * @param {RPCSocket} socket - socket to subscribe/unsubscribe
         *
         * @returns {*}
         *
         * @private
         */

    }, {
        key: "_updateRemoteSubscribers",
        value: function _updateRemoteSubscribers(add, notifications, socket) {
            var _this4 = this;

            if (!Array.isArray(notifications)) throw new Error("No notifications passed");

            return notifications.reduce(function (result, notificationName) {
                if (!_this4.options.strict_notifications) {
                    result[notificationName] = "ok";
                } else if (_this4._notificationToSubscribers.has(notificationName)) {
                    var subscribedSockets = _this4._notificationToSubscribers.get(notificationName);
                    if (add) subscribedSockets.add(socket);else subscribedSockets.delete(socket);
                    result[notificationName] = "ok";
                } else result[notificationName] = "provided event invalid";

                return result;
            }, {});
        }

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

            if (subscriptions && (typeof subscriptions === "undefined" ? "undefined" : (0, _typeof3.default)(subscriptions)) !== "object") subscriptions = (0, _defineProperty3.default)({}, subscriptions, handler);

            if (!subscriptions || (typeof subscriptions === "undefined" ? "undefined" : (0, _typeof3.default)(subscriptions)) !== "object" || Array.isArray(subscriptions)) throw new Error("Subsciptions is not a mapping of names to handlers");

            var eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification";
            (0, _entries2.default)(subscriptions).forEach(function (_ref2) {
                var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
                    n = _ref3[0],
                    h = _ref3[1];

                if (typeof n !== "string" || n.trim().length === 0) throw new Error("Notification name should be non-empty string, " + (typeof n === "undefined" ? "undefined" : (0, _typeof3.default)(n)) + " passed");
                if (typeof h !== "function") throw new Error("Notification handler is not defined, or have incorrect type");
                if (!isInternal && n.startsWith("rpc.")) throw new Error("Notification with 'rpc.' prefix is for internal use only. " + "To subscribe/unsubsrcibe to such notification use methods " + "\"subscribeInternal\"/\"ubsubscribeInternal\"");

                // Add "rpc." prefix for internal requests if omitted:
                if (isInternal && !n.startsWith("rpc.")) n = "rpc." + n;

                _this5[action](eventPrefix + ":" + n, h);
            });
        }

        /**
         * Register notification with given names as possible to be fired
         *
         * @param {string|array<string>} names - notification names
         *
         * @returns {void}
         */

    }, {
        key: "registerNotification",
        value: function registerNotification(names) {
            return this._changeNotificationPresence(true, false, names);
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
            return this._changeNotificationPresence(false, false, names);
        }

        /**
         * Returns list of registered notification names
         *
         * @returns {Array}
         */

    }, {
        key: "getRegisteredNotifications",
        value: function getRegisteredNotifications() {
            return (0, _from2.default)(this._notificationToSubscribers.keys()).filter(function (name) {
                return !name.startsWith("rpc.");
            });
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
            this._changeSubscriptionStatus("on", false, notification, handler);
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
            this._changeSubscriptionStatus("once", false, notification, handler);
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
            this._changeSubscriptionStatus("off", false, notification, handler);
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
        value: function sendNotification(name, params) {
            // Send notification to all connected sockets if namespace is not using
            // "string subscriptions", otherwise send notification only to subscribed sockets:
            var clients = this.options.strict_notifications ? this._notificationToSubscribers.get(name) : this.getClients();

            if (clients) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = (0, _getIterator3.default)(clients), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var socket = _step3.value;

                        socket.sendNotification(name, params);
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            }
        }

        /* ----------------------------------------
         | Internal notifications related methods
         |----------------------------------------
         |
         |*/

        /**
         * Register notification with given names as possible to be fired
         *
         * @param {string|array<string>} names - notification names
         *
         * @returns {void}
         */

    }, {
        key: "registerInternalNotification",
        value: function registerInternalNotification(names) {
            return this._changeNotificationPresence(true, true, names);
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
            return this._changeNotificationPresence(false, true, names);
        }

        /**
         * Returns list of registered notification names
         *
         * @returns {Array}
         */

    }, {
        key: "getRegisteredInternalNotifications",
        value: function getRegisteredInternalNotifications() {
            return (0, _from2.default)(this._notificationToSubscribers.keys()).filter(function (name) {
                return name.startsWith("rpc.");
            });
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
            this._changeSubscriptionStatus("on", false, notification, handler);
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
            this._changeSubscriptionStatus("once", false, notification, handler);
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
            this._changeSubscriptionStatus("off", false, notification, handler);
        }

        /**
         * Send notification to all subscribed sockets
         *
         * @param {string} name - name of notification
         * @param {Array|object} params - notification parameters
         *
         * @returns {void}
         */

    }, {
        key: "sendInternalNotification",
        value: function sendInternalNotification(name, params) {
            // Send notification to all connected sockets if namespace is not using
            // "string subscriptions", otherwise send notification only to subscribed sockets:
            var clients = this.options.strict_notifications ? this._notificationToSubscribers.get(name) : this.getClients();

            if (clients) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = (0, _getIterator3.default)(clients), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var socket = _step4.value;

                        socket.sendNotification(name, params);
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
            }
        }

        /*
         |------------------------------------------------------------------------------------------
         | RPC-methods related methods
         |------------------------------------------------------------------------------------------
         |
         |*/

        /**
         * Register given methods
         *
         * @param {boolean} isInternal - is registered methods are internal
         * @param {string|object} methods - method name, or map of method => handler to register
         * @param {function} methodHandler? - handler for method, required only if method name passed
         *
         * @returns {void}
         *
         * @private
         */

    }, {
        key: "_registerMethods",
        value: function _registerMethods(isInternal, methods, methodHandler) {
            var _this6 = this;

            if (methods && (typeof methods === "undefined" ? "undefined" : (0, _typeof3.default)(methods)) !== "object") {
                methods = (0, _defineProperty3.default)({}, methods, methodHandler);
            }

            if (!methods || (typeof methods === "undefined" ? "undefined" : (0, _typeof3.default)(methods)) !== "object" || Array.isArray(methods)) throw new Error("Methods list is not a mapping of names to handlers");

            (0, _entries2.default)(methods).forEach(function (_ref4) {
                var _ref5 = (0, _slicedToArray3.default)(_ref4, 2),
                    name = _ref5[0],
                    handler = _ref5[1];

                if (!isInternal && name.startsWith("rpc.")) throw new Error("\".rpc\" prefix should be used only for internal methods");
                if (isInternal && !name.startsWith("rpc.")) name = "rpc." + name;

                if (typeof methodHandler !== "function") throw new Error("Method handler is not a function");

                _this6._requestsHandlers.set(name, handler);
            });
        }

        /**
         * Unregister given methods
         *
         * @param {boolean} isInternal - is unregistered methods are internal
         * @param {string|Array.<string>} methods - list of methods to unregister
         *
         * @returns {void}
         *
         * @private
         */

    }, {
        key: "_unregisterMethods",
        value: function _unregisterMethods(isInternal, methods) {
            var _this7 = this;

            if (methods && !Array.isArray(methods)) methods = [methods];

            methods.forEach(function (method) {
                if (!isInternal && method.startsWith("rpc.")) throw new Error("\".rpc\" prefix should be used only for internal methods");
                if (isInternal && !method.startsWith("rpc.")) method = "rpc." + method;

                _this7._requestsHandlers.delete(method);
            });
        }

        /**
         * Register a handler for method with given name or given hash of methods
         *
         * @param {object|string} methods - method name or map of method => handler
         * @param {function} methodHandler? - handler function (required only if method name is passed)
         *
         * @returns {void}
         */

    }, {
        key: "registerMethod",
        value: function registerMethod(methods, methodHandler) {
            this._registerMethods(false, methods, methodHandler);
        }

        /**
         * Unregister a handler for method with given name or given hash of methods
         *
         * @param {object|string} methods - method name or map of method => handler
         *
         * @returns {void}
         */

    }, {
        key: "unregisterMethod",
        value: function unregisterMethod(methods) {
            this._unregisterMethods(false, methods);
        }

        /**
         * Returns list of registered methods
         *
         * @returns {Array<string>}
         */

    }, {
        key: "getRegisteredMethodsNames",
        value: function getRegisteredMethodsNames() {
            return (0, _from2.default)(this._requestsHandlers.keys()).filter(function (eventName) {
                return !eventName.startsWith("rpc.");
            });
        }

        /**
         * Register a handler for method with given name or given hash of methods
         *
         * @param {object|string} methods - method name or map of method => handler
         * @param {function} methodHandler? - handler function (required only if method name is passed)
         *
         * @returns {void}
         */

    }, {
        key: "registerInternalMethod",
        value: function registerInternalMethod(methods, methodHandler) {
            this._registerMethods(true, methods, methodHandler);
        }

        /**
         * Unregister a handler for method with given name or given hash of methods
         *
         * @param {string|array<string>} methods - method name or list of methods to delete
         *
         * @returns {void}
         */

    }, {
        key: "unregisterInternalMethod",
        value: function unregisterInternalMethod(methods) {
            this._unregisterMethods(true, methods);
        }

        /**
         * Returns list of registered internal methods
         *
         * @returns {Array<string>}
         */

    }, {
        key: "getRegisteredInternalMethodsNames",
        value: function getRegisteredInternalMethodsNames() {
            return (0, _from2.default)(this._requestsHandlers.keys()).filter(function (eventName) {
                return eventName.startsWith("rpc.");
            }).map(function (eventName) {
                return eventName.slice(3);
            });
        }

        /* ----------------------------------------
         | Deprecated methods
         |----------------------------------------
         |
         |*/

        /**
         * Registers given notification
         * @param {string} ev_name - name of notification
         * @returns {void}
         * @deprecated
         */

    }, {
        key: "event",
        value: function event(ev_name) {
            if (arguments.length !== 1) throw new Error("must provide exactly one argument");

            if (typeof ev_name !== "string") throw new Error("name must be a string");

            if (ev_name.startsWith("rpc.")) this.registerInternalNotification(ev_name);else this.registerNotification(ev_name);
        }

        /**
         * Register a handler for given RPC method
         * @param {string} fn_name - method name
         * @param {function} fn - method handler
         * @returns {void}
         * @deprecated
         */

    }, {
        key: "register",
        value: function register(fn_name, fn) {
            if (arguments.length !== 2) throw new Error("must provide exactly two arguments");

            if (fn_name.startsWith("rpc.")) this.registerInternalMethod(fn_name, fn);else this.registerMethod(fn_name, fn);
        }

        /**
         * Returns registered notifications
         * @returns {Array}
         * @deprecated
         */

    }, {
        key: "connected",


        /**
         * Returns a hash of websocket objects connected to this namespace.
         * @inner
         * @method
         * @return {Object}
         * @deprecated
         */
        value: function connected() {
            var clients = {};

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = (0, _getIterator3.default)(this._clients), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var client = _step5.value;

                    clients[client.getId()] = client;
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return clients;
        }

        /**
         * Returns a list of client unique identifiers connected to this namespace.
         * It is not an alias to "getClients" because "getClients" returns iterator over clients,
         * while this method return array of connected clients
         *
         * @inner
         * @method
         * @deprecated
         * @return {Array}
         */

    }, {
        key: "clients",
        value: function clients() {
            return (0, _from2.default)(this.getClients());
        }
    }, {
        key: "eventList",
        get: function get() {
            return this.getRegisteredNotifications().concat(this.getRegisteredInternalNotifications());
        }
    }]);
    return Namespace;
}(_eventemitter2.default);

exports.default = Namespace;