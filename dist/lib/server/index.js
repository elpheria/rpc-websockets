/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _ws = require("ws");

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _uuid = _interopRequireDefault(require("uuid"));

var _url = _interopRequireDefault(require("url"));

var _assertArgs = _interopRequireDefault(require("assert-args"));

var _JsonRpcSocket = _interopRequireWildcard(require("../JsonRpcSocket"));

var _Namespace = _interopRequireWildcard(require("../Namespace"));

var _helpers = require("../helpers");

// @ts-ignore
var Server =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2["default"])(Server, _EventEmitter);

  function Server() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, Server);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Server).call(this));

    if (options.strict_notifications !== undefined && typeof options.strict_notifications !== "boolean") {
      var argType = (0, _helpers.getType)(options.strict_notifications);
      throw new TypeError("\"strict_notifications\" should be boolean, \"".concat(argType, "\" given"));
    }

    if (options.idParam !== undefined && typeof options.idParam !== "string") {
      throw new TypeError("\"idParam\" should be a string, \"".concat((0, _helpers.getType)(options.idParam), "\" given"));
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


    _this.options = Object.assign({
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

    _this._namespaces = new Map();
    /**
     * Stores all connected sockets as uuid => socket
     *
     * @type {Map<string|number, WebSocket>}
     *
     * @private
     */

    _this._sockets = new Map();
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


  (0, _createClass2["default"])(Server, [{
    key: "_startServer",
    value: function _startServer(options) {
      var _this2 = this;

      var server = new _ws.Server(options);
      server.on("listening", function () {
        return _this2.emit("listening");
      });
      server.on("connection", function (socket, request) {
        _this2.emit("connection", socket, request);

        var u = _url["default"].parse(request.url, true);

        var ns = u.pathname;

        var id = u.query[_this2.options.idParam] || _uuid["default"].v1(); // Create RPC wrapper for socket:


        var wrappedSocket = new _JsonRpcSocket["default"](socket, id); // Register socket and set it to some namespace:

        _this2._sockets.set(id, wrappedSocket);

        _this2.getOrCreateNamespace(ns).addClient(wrappedSocket); // Emit an event about RPC connection:


        _this2.emit("RPCConnection", wrappedSocket, request); // Clear socket data on delete:


        socket.on("close", function () {
          return _this2._sockets["delete"](id);
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

      return new Promise(function (resolve, reject) {
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
        throw new TypeError("Expected Socket ID as number, ".concat((0, _helpers.getType)(id), " passed"));
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
        throw new Error("Failed to create namespace: Namespace with name ".concat(name, " already exists"));
      }

      var ns = new _Namespace["default"](name, {
        strict_notifications: this.options.strict_notifications
      });

      this._namespaces.set(name, ns); // Handle notifications:


      ns.on("rpc:notification", function (notification, socket) {
        _this4.emit("rpc:notification", notification, socket, ns);

        _this4.emit("rpc:notification:".concat(notification.method), notification.params, socket, ns);
      }); // Handle internal notifications:

      ns.on("rpc:internal:notification", function (notification, socket) {
        _this4.emit("rpc:internal:notification", notification, socket, ns);

        _this4.emit("rpc:internal:notification:".concat(notification.method), notification.params, socket, ns);
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

        this._namespaces["delete"](name);
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

      if (typeof subscriptions === "string") subscriptions = (0, _defineProperty2["default"])({}, subscriptions, handler);
      if (!subscriptions || (0, _typeof2["default"])(subscriptions) !== "object" || Array.isArray(subscriptions)) throw new TypeError("Subsciptions is not a mapping of names to handlers");
      var eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification";
      Object.entries(subscriptions).forEach(function (_ref) {
        var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
            n = _ref2[0],
            h = _ref2[1];

        (0, _Namespace.assertNotificationName)(n, isInternal);
        if (typeof h !== "function") throw new TypeError("Expected function as notification handler, got ".concat((0, _helpers.getType)(h))); // Add "rpc." prefix for internal requests if omitted:

        if (isInternal && !n.startsWith("rpc.")) n = "rpc.".concat(n);

        _this5[action]("".concat(eventPrefix, ":").concat(n), h);
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

      names.forEach(function (name) {
        return (0, _Namespace.assertNotificationName)(name);
      });
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
    value: function sendNotification(name, params) {
      var notificationsSent, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, namespace, sendProcess;

      return _regenerator["default"].async(function sendNotification$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              (0, _Namespace.assertNotificationName)(name);
              notificationsSent = [];
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 5;

              for (_iterator = this._namespaces.values()[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
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
              return _context.abrupt("return", Promise.all(notificationsSent));

            case 22:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[5, 9, 13, 21], [14,, 16, 20]]);
    }
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

      if (!Array.isArray(names)) {
        names = [names];
      }

      names.forEach(function (name) {
        return (0, _Namespace.assertNotificationName)(name, true);
      });
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
      var notificationsSent, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, namespace, sendProcess;

      return _regenerator["default"].async(function sendInternalNotification$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              (0, _Namespace.assertNotificationName)(name, true);
              notificationsSent = [];
              _iteratorNormalCompletion2 = true;
              _didIteratorError2 = false;
              _iteratorError2 = undefined;
              _context2.prev = 5;

              for (_iterator2 = this._namespaces.values()[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                namespace = _step2.value;
                sendProcess = namespace.sendInternalNotification(name, params);
                notificationsSent.push(sendProcess);
              }

              _context2.next = 13;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2["catch"](5);
              _didIteratorError2 = true;
              _iteratorError2 = _context2.t0;

            case 13:
              _context2.prev = 13;
              _context2.prev = 14;

              if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                _iterator2["return"]();
              }

            case 16:
              _context2.prev = 16;

              if (!_didIteratorError2) {
                _context2.next = 19;
                break;
              }

              throw _iteratorError2;

            case 19:
              return _context2.finish(16);

            case 20:
              return _context2.finish(13);

            case 21:
              return _context2.abrupt("return", Promise.all(notificationsSent));

            case 22:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[5, 9, 13, 21], [14,, 16, 20]]);
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
      this.getOrCreateNamespace(ns).registerMethod(name, fn);
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
    value: function unregisterMethod(name) {
      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
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
      this.getOrCreateNamespace(ns).registerInternalMethod(name, fn);
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
    value: function unregisterInternalMethod(name) {
      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
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
      (0, _assertArgs["default"])(arguments, {
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
      (0, _assertArgs["default"])(arguments, {
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
      (0, _assertArgs["default"])(arguments, {
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
}(_eventemitter["default"]);

exports["default"] = Server;
Server.RPCResponseTimeoutError = _JsonRpcSocket.TimeoutError;
Server.RPCServerError = _JsonRpcSocket.RPCServerError;