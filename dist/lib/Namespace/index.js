"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertNamespaceName = assertNamespaceName;
exports.assertNotificationName = assertNotificationName;
exports["default"] = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _JsonRpcSocket = _interopRequireWildcard(require("../JsonRpcSocket"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _helpers = require("../helpers");

/**
 * Function that validates namespace name
 * @param {string} name - name to validate
 * @throws TypeError if name is not valid
 * @returns {void}
 */
function assertNamespaceName(name) {
  if (name === null || name === undefined || typeof name === "string" && name.trim().length === 0) {
    throw new TypeError("No namespace name is passed");
  }

  if (typeof name !== "string") throw new TypeError("Name of namespace should be a string, ".concat((0, _helpers.getType)(name), " passed"));
}
/**
 * Function that validates notification name
 * @param {string} name - name to validate
 * @param {boolean} isInternal - is notification internal or not
 * @throws TypeError if name is not valid
 * @returns {void}
 */


function assertNotificationName(name) {
  var isInternal = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (typeof name !== "string") throw new TypeError("Notification name should be a string, ".concat((0, _helpers.getType)(name), " passed"));

  if (name.trim().length === 0) {
    throw new Error("Given notification name is empty");
  }

  if (!isInternal && name.startsWith("rpc.")) throw new Error("Notifications with prefix \"rpc.\" is for internal usage only");
}
/**
 * Namespace class
 * @class
 */


var Namespace =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2["default"])(Namespace, _EventEmitter);

  function Namespace(name, options) {
    var _this;

    (0, _classCallCheck2["default"])(this, Namespace);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Namespace).call(this));
    assertNamespaceName(name);
    _this._name = name;
    /**
     * Old namespace API allows to get name by property "name", that's why it is here:
     * // TODO: remove it
     * @deprecated
     */

    Object.defineProperty((0, _assertThisInitialized2["default"])(_this), "name", {
      get: function get() {
        return this.getName();
      },
      set: function set(name) {
        this._name = name;
      }
    });
    _this.options = Object.assign({
      // Whether to send notifications to all connected sockets (false) or to only
      // subscribed sockets (true)
      strict_notifications: true
    }, options);
    _this._clients = new Set();
    _this._requestsHandlers = new Map();
    _this._notificationToSubscribers = new Map(); // Register internal methods:
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

  (0, _createClass2["default"])(Namespace, [{
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
        for (var _iterator = this.getClients()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var socket = _step.value;
          socket.close(1000, "Namespace is closing");
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
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
     * Returns name of namespace
     * @returns {*}
     */

  }, {
    key: "getName",
    value: function getName() {
      return this._name;
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
    value: function _handleRequest(request, response, socket) {
      var requestHandler, result;
      return _regenerator["default"].async(function _handleRequest$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (this._requestsHandlers.has(request.method)) {
                _context.next = 3;
                break;
              }

              response["throw"](_JsonRpcSocket.RPC_ERRORS.METHOD_NOT_FOUND);
              return _context.abrupt("return");

            case 3:
              requestHandler = this._requestsHandlers.get(request.method);
              _context.prev = 4;
              _context.next = 7;
              return _regenerator["default"].awrap(requestHandler(request.params, socket));

            case 7:
              result = _context.sent;
              _context.next = 14;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](4);
              // If error signature was thrown ({error, message, data})
              if (!(_context.t0 instanceof Error)) {
                if (typeof _context.t0.code === "undefined") response["throw"](_JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR);else response["throw"]({
                  code: _context.t0.code,
                  message: _context.t0.message || _JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR.message
                }, _context.t0.data);
              } else response["throw"](_JsonRpcSocket.RPC_ERRORS.INTERNAL_SERVER_ERROR, _context.t0.message);
              return _context.abrupt("return");

            case 14:
              response.send(result);

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[4, 10]]);
    }
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
        if (!(socket instanceof _JsonRpcSocket["default"])) throw new Error("Socket should be an instance of RPCSocket");

        this._clients.add(socket); // cleanup after the socket gets disconnected:


        socket.on("close", function () {
          return _this2.removeClient(socket);
        }); // Handle notifications:

        socket.on("rpc:notification", function (notification) {
          _this2.emit("rpc:notification", notification, socket);

          _this2.emit("rpc:notification:".concat(notification.method), notification.params, socket);
        }); // Handle internal notifications:

        socket.on("rpc:internal:notification", function (notification) {
          _this2.emit("rpc:internal:notification", notification, socket);

          _this2.emit("rpc:internal:notification:".concat(notification.method), notification.params, socket);
        }); // Handle requests on socket:

        socket.on("rpc:request", this._handleRequest, this); // Handle various internal requests on socket:

        socket.on("rpc:internal:request", this._handleRequest, this);
      }

      return this;
    }
  }, {
    key: "removeClient",
    value: function removeClient(socket) {
      this._clients["delete"](socket);

      this._notificationToSubscribers.forEach(function (subscribers) {
        return subscribers["delete"](socket);
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
        for (var _iterator2 = this._clients[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
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
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
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
        assertNotificationName(name, isInternal);
        if (isInternal && !name.startsWith("rpc.")) name = "rpc.".concat(name);

        if (shouldBeAdded) {
          if (!_this3._notificationToSubscribers.has(name)) _this3._notificationToSubscribers.set(name, new Set());
        } else _this3._notificationToSubscribers["delete"](name);
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

          if (add) subscribedSockets.add(socket);else subscribedSockets["delete"](socket);
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

      if (subscriptions && (0, _typeof2["default"])(subscriptions) !== "object") subscriptions = (0, _defineProperty2["default"])({}, subscriptions, handler);
      if (!subscriptions || (0, _typeof2["default"])(subscriptions) !== "object" || Array.isArray(subscriptions)) throw new Error("Subsciptions is not a mapping of names to handlers");
      var eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification";
      Object.entries(subscriptions).forEach(function (_ref) {
        var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
            n = _ref2[0],
            h = _ref2[1];

        if (typeof n !== "string" || n.trim().length === 0) throw new Error("Notification name should be non-empty string, ".concat((0, _typeof2["default"])(n), " passed"));
        if (typeof h !== "function") throw new Error("Notification handler is not defined, or have incorrect type");
        if (!isInternal && n.startsWith("rpc.")) throw new Error("Notification with 'rpc.' prefix is for internal use only. " + "To subscribe/unsubsrcibe to such notification use methods " + "\"subscribeInternal\"/\"ubsubscribeInternal\""); // Add "rpc." prefix for internal requests if omitted:

        if (isInternal && !n.startsWith("rpc.")) n = "rpc.".concat(n);

        _this5[action]("".concat(eventPrefix, ":").concat(n), h);
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
      return Array.from(this._notificationToSubscribers.keys()).filter(function (name) {
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
      var clients, notificationsSent, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, socket, sendProcess;

      return _regenerator["default"].async(function sendNotification$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              assertNotificationName(name); // Send notification to all connected sockets if namespace is not using
              // "string subscriptions", otherwise send notification only to subscribed sockets:

              clients = this.options.strict_notifications ? this._notificationToSubscribers.get(name) : this.getClients();
              notificationsSent = [];

              if (!clients) {
                _context2.next = 23;
                break;
              }

              _iteratorNormalCompletion3 = true;
              _didIteratorError3 = false;
              _iteratorError3 = undefined;
              _context2.prev = 7;

              for (_iterator3 = clients[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                socket = _step3.value;
                sendProcess = socket.sendNotification(name, params);
                notificationsSent.push(sendProcess);
              }

              _context2.next = 15;
              break;

            case 11:
              _context2.prev = 11;
              _context2.t0 = _context2["catch"](7);
              _didIteratorError3 = true;
              _iteratorError3 = _context2.t0;

            case 15:
              _context2.prev = 15;
              _context2.prev = 16;

              if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                _iterator3["return"]();
              }

            case 18:
              _context2.prev = 18;

              if (!_didIteratorError3) {
                _context2.next = 21;
                break;
              }

              throw _iteratorError3;

            case 21:
              return _context2.finish(18);

            case 22:
              return _context2.finish(15);

            case 23:
              return _context2.abrupt("return", Promise.all(notificationsSent));

            case 24:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[7, 11, 15, 23], [16,, 18, 22]]);
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
      return Array.from(this._notificationToSubscribers.keys()).filter(function (name) {
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
      this._changeSubscriptionStatus("on", true, notification, handler);
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
      this._changeSubscriptionStatus("once", true, notification, handler);
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
      this._changeSubscriptionStatus("off", true, notification, handler);
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
      var clients, notificationsSent, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, socket, sendProcess;

      return _regenerator["default"].async(function sendInternalNotification$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              assertNotificationName(name, true);

              if (!name.startsWith("rpc.")) {
                name = "rpc.".concat(name);
              } // Send notification to all connected sockets if namespace is not using
              // "string subscriptions", otherwise send notification only to subscribed sockets:


              clients = this.options.strict_notifications ? this._notificationToSubscribers.get(name) : this.getClients();
              notificationsSent = [];

              if (!clients) {
                _context3.next = 24;
                break;
              }

              _iteratorNormalCompletion4 = true;
              _didIteratorError4 = false;
              _iteratorError4 = undefined;
              _context3.prev = 8;

              for (_iterator4 = clients[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                socket = _step4.value;
                sendProcess = socket.sendInternalNotification(name, params);
                notificationsSent.push(sendProcess);
              }

              _context3.next = 16;
              break;

            case 12:
              _context3.prev = 12;
              _context3.t0 = _context3["catch"](8);
              _didIteratorError4 = true;
              _iteratorError4 = _context3.t0;

            case 16:
              _context3.prev = 16;
              _context3.prev = 17;

              if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                _iterator4["return"]();
              }

            case 19:
              _context3.prev = 19;

              if (!_didIteratorError4) {
                _context3.next = 22;
                break;
              }

              throw _iteratorError4;

            case 22:
              return _context3.finish(19);

            case 23:
              return _context3.finish(16);

            case 24:
              return _context3.abrupt("return", Promise.all(notificationsSent));

            case 25:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this, [[8, 12, 16, 24], [17,, 19, 23]]);
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

      if (methods && (0, _typeof2["default"])(methods) !== "object") {
        methods = (0, _defineProperty2["default"])({}, methods, methodHandler);
      }

      if (!methods || (0, _typeof2["default"])(methods) !== "object" || Array.isArray(methods)) throw new Error("Methods list is not a mapping of names to handlers");
      Object.entries(methods).forEach(function (_ref3) {
        var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
            name = _ref4[0],
            handler = _ref4[1];

        if (!isInternal && name.startsWith("rpc.")) throw new Error("\".rpc\" prefix should be used only for internal methods");
        if (isInternal && !name.startsWith("rpc.")) name = "rpc.".concat(name);
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

      var methodsList = Array.isArray(methods) ? methods : [methods];
      methodsList.forEach(function (method) {
        if (!isInternal && method.startsWith("rpc.")) throw new Error("\".rpc\" prefix should be used only for internal methods");
        if (isInternal && !method.startsWith("rpc.")) method = "rpc.".concat(method);

        _this7._requestsHandlers["delete"](method);
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
     * @param {Array<string>|string} methods - method name or map of method => handler
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
      return Array.from(this._requestsHandlers.keys()).filter(function (eventName) {
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
      return Array.from(this._requestsHandlers.keys()).filter(function (eventName) {
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
        for (var _iterator5 = this._clients[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var client = _step5.value;
          clients[client.getId()] = client;
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
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
      return Array.from(this.getClients());
    }
  }, {
    key: "eventList",
    get: function get() {
      return this.getRegisteredNotifications().concat(this.getRegisteredInternalNotifications());
    }
  }]);
  return Namespace;
}(_eventemitter["default"]);

exports["default"] = Namespace;