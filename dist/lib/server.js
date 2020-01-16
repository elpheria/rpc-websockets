/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */
"use strict"; // @ts-ignore

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertArgs = _interopRequireDefault(require("assert-args"));

var _eventemitter = require("eventemitter3");

var _ws = require("ws");

var _uuid = _interopRequireDefault(require("uuid"));

var _url = _interopRequireDefault(require("url"));

var _circularJson = _interopRequireDefault(require("circular-json"));

var utils = _interopRequireWildcard(require("./utils"));

var Server =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2["default"])(Server, _EventEmitter);

  /**
   * Instantiate a Server class.
   * @constructor
   * @param {Object} options - ws constructor's parameters with rpc
   * @return {Server} - returns a new Server instance
   */
  function Server(options) {
    var _this;

    (0, _classCallCheck2["default"])(this, Server);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Server).call(this));
    /**
     * Stores all connected sockets with a universally unique identifier
     * in the appropriate namespace.
     * Stores all rpc methods to specific namespaces. "/" by default.
     * Stores all events as keys and subscribed users in array as value
     * @private
     * @name namespaces
     * @param {Object} namespaces.rpc_methods
     * @param {Map} namespaces.clients
     * @param {Object} namespaces.events
     */

    _this.namespaces = {};
    _this.authenticated = false;
    _this.wss = new _ws.Server(options);

    _this.wss.on("listening", function () {
      return _this.emit("listening");
    });

    _this.wss.on("connection", function (socket, request) {
      _this.emit("connection", socket, request);

      var u = _url["default"].parse(request.url, true);

      var ns = u.pathname;
      if (u.query.socket_id) socket._id = u.query.socket_id;else socket._id = _uuid["default"].v1(); // cleanup after the socket gets disconnected

      socket.on("close", function () {
        _this.namespaces[ns].clients["delete"](socket._id);

        for (var _i = 0, _Object$keys = Object.keys(_this.namespaces[ns].events); _i < _Object$keys.length; _i++) {
          var event = _Object$keys[_i];

          var index = _this.namespaces[ns].events[event].indexOf(socket._id);

          if (index >= 0) _this.namespaces[ns].events[event].splice(index, 1);
        }
      });
      if (!_this.namespaces[ns]) _this._generateNamespace(ns); // store socket and method

      _this.namespaces[ns].clients.set(socket._id, socket);

      return _this._handleRPC(socket, ns);
    });

    _this.wss.on("error", function (error) {
      return _this.emit("error", error);
    });

    return _this;
  }
  /**
   * Registers an RPC method.
   * @method
   * @param {String} name - method name
   * @param {Function} fn - a callee function
   * @param {String} ns - namespace identifier
   * @throws {TypeError}
   * @return {Object} - returns the RPCMethod object
   */


  (0, _createClass2["default"])(Server, [{
    key: "register",
    value: function register(name, fn) {
      var _this2 = this;

      var ns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "/";
      (0, _assertArgs["default"])(arguments, {
        name: "string",
        fn: "function",
        "[ns]": "string"
      });
      if (!this.namespaces[ns]) this._generateNamespace(ns);
      this.namespaces[ns].rpc_methods[name] = {
        fn: fn,
        "protected": false
      };
      return {
        "protected": function _protected() {
          return _this2._makeProtected(name, ns);
        },
        "public": function _public() {
          return _this2._makePublic(name, ns);
        }
      };
    }
    /**
     * Sets an auth method.
     * @method
     * @param {Function} fn - an arbitrary auth method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */

  }, {
    key: "setAuth",
    value: function setAuth(fn) {
      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
      this.register("rpc.login", fn, ns);
    }
    /**
     * Marks an RPC method as protected.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */

  }, {
    key: "_makeProtected",
    value: function _makeProtected(name) {
      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
      this.namespaces[ns].rpc_methods[name]["protected"] = true;
    }
    /**
     * Marks an RPC method as public.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */

  }, {
    key: "_makePublic",
    value: function _makePublic(name) {
      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
      this.namespaces[ns].rpc_methods[name]["protected"] = false;
    }
    /**
     * Removes a namespace and closes all connections
     * @method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */

  }, {
    key: "closeNamespace",
    value: function closeNamespace(ns) {
      (0, _assertArgs["default"])(arguments, {
        ns: "string"
      });
      var namespace = this.namespaces[ns];

      if (namespace) {
        delete namespace.rpc_methods;
        delete namespace.events;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = namespace.clients.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var socket = _step.value;
            socket.close();
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

        delete this.namespaces[ns];
      }
    }
    /**
     * Creates a new event that can be emitted to clients.
     * @method
     * @param {String} name - event name
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */

  }, {
    key: "event",
    value: function event(name) {
      var _this3 = this;

      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
      (0, _assertArgs["default"])(arguments, {
        "name": "string",
        "[ns]": "string"
      });
      if (!this.namespaces[ns]) this._generateNamespace(ns);else {
        var index = this.namespaces[ns].events[name];
        if (index !== undefined) throw new Error("Already registered event ".concat(ns).concat(name));
      }
      this.namespaces[ns].events[name] = []; // forward emitted event to subscribers

      this.on(name, function () {
        for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
          params[_key] = arguments[_key];
        }

        // flatten an object if no spreading is wanted
        if (params.length === 1 && params[0] instanceof Object) params = params[0];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = _this3.namespaces[ns].events[name][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var socket_id = _step2.value;

            var socket = _this3.namespaces[ns].clients.get(socket_id);

            if (!socket) continue;
            socket.send(_circularJson["default"].stringify({
              notification: name,
              params: params || null
            }));
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
      });
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
      (0, _assertArgs["default"])(arguments, {
        "name": "string"
      });
      if (!this.namespaces[name]) this._generateNamespace(name);
      var self = this;
      return {
        // self.register convenience method
        register: function register(fn_name, fn) {
          if (arguments.length !== 2) throw new Error("must provide exactly two arguments");
          if (typeof fn_name !== "string") throw new Error("name must be a string");
          if (typeof fn !== "function") throw new Error("handler must be a function");
          return self.register(fn_name, fn, name);
        },
        // self.event convenience method
        event: function event(ev_name) {
          if (arguments.length !== 1) throw new Error("must provide exactly one argument");
          if (typeof ev_name !== "string") throw new Error("name must be a string");
          self.event(ev_name, name);
        },

        // self.eventList convenience method
        get eventList() {
          return Object.keys(self.namespaces[name].events);
        },

        /**
         * Emits a specified event to this namespace.
         * @inner
         * @method
         * @param {String} event - event name
         * @param {Array} params - event parameters
         * @return {Undefined}
         */
        emit: function emit(event) {
          var socket_ids = (0, _toConsumableArray2["default"])(self.namespaces[name].clients.keys());

          for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            params[_key2 - 1] = arguments[_key2];
          }

          for (var i = 0, id; id = socket_ids[i]; ++i) {
            self.namespaces[name].clients.get(id).send(_circularJson["default"].stringify({
              notification: event,
              params: params || []
            }));
          }
        },

        /**
         * Returns a name of this namespace.
         * @inner
         * @method
         * @kind constant
         * @return {String}
         */
        get name() {
          return name;
        },

        /**
         * Returns a hash of websocket objects connected to this namespace.
         * @inner
         * @method
         * @return {Object}
         */
        connected: function connected() {
          var socket_ids = (0, _toConsumableArray2["default"])(self.namespaces[name].clients.keys());
          return socket_ids.reduce(function (acc, curr) {
            return Object.assign(Object.assign({}, acc), (0, _defineProperty2["default"])({}, curr, self.namespaces[name].clients.get(curr)));
          }, {});
        },

        /**
         * Returns a list of client unique identifiers connected to this namespace.
         * @inner
         * @method
         * @return {Array}
         */
        clients: function clients() {
          return self.namespaces[name];
        }
      };
    }
    /**
     * Lists all created events in a given namespace. Defaults to "/".
     * @method
     * @param {String} ns - namespaces identifier
     * @readonly
     * @return {Array} - returns a list of created events
     */

  }, {
    key: "eventList",
    value: function eventList() {
      var ns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";
      (0, _assertArgs["default"])(arguments, {
        "[ns]": "string"
      });
      if (!this.namespaces[ns]) return [];
      return Object.keys(this.namespaces[ns].events);
    }
    /**
     * Creates a JSON-RPC 2.0 compliant error
     * @method
     * @param {Number} code - indicates the error type that occurred
     * @param {String} message - provides a short description of the error
     * @param {String|Object} data - details containing additional information about the error
     * @return {Object}
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
    /**
     * Closes the server and terminates all clients.
     * @method
     * @return {Promise}
     */

  }, {
    key: "close",
    value: function close() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        try {
          _this4.wss.close();

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }
    /**
     * Handles all WebSocket JSON RPC 2.0 requests.
     * @private
     * @param {Object} socket - ws socket instance
     * @param {String} ns - namespaces identifier
     * @return {Undefined}
     */

  }, {
    key: "_handleRPC",
    value: function _handleRPC(socket) {
      var _this5 = this;

      var ns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";
      socket.on("message", function _callee(data) {
        var msg_options, parsedData, responses, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, message, _response, response;

        return _regenerator["default"].async(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                msg_options = {};

                if (data instanceof ArrayBuffer) {
                  msg_options.binary = true;
                  data = Buffer.from(data).toString();
                }

                _context.prev = 2;
                parsedData = JSON.parse(data);
                _context.next = 9;
                break;

              case 6:
                _context.prev = 6;
                _context.t0 = _context["catch"](2);
                return _context.abrupt("return", socket.send(JSON.stringify({
                  jsonrpc: "2.0",
                  error: utils.createError(-32700, _context.t0.toString()),
                  id: null
                }), msg_options));

              case 9:
                if (!Array.isArray(parsedData)) {
                  _context.next = 46;
                  break;
                }

                if (parsedData.length) {
                  _context.next = 12;
                  break;
                }

                return _context.abrupt("return", socket.send(JSON.stringify({
                  jsonrpc: "2.0",
                  error: utils.createError(-32600, "Invalid array"),
                  id: null
                }), msg_options));

              case 12:
                responses = [];
                _iteratorNormalCompletion3 = true;
                _didIteratorError3 = false;
                _iteratorError3 = undefined;
                _context.prev = 16;
                _iterator3 = parsedData[Symbol.iterator]();

              case 18:
                if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                  _context.next = 29;
                  break;
                }

                message = _step3.value;
                _context.next = 22;
                return _regenerator["default"].awrap(_this5._runMethod(message, socket._id, ns));

              case 22:
                _response = _context.sent;

                if (_response) {
                  _context.next = 25;
                  break;
                }

                return _context.abrupt("continue", 26);

              case 25:
                responses.push(_response);

              case 26:
                _iteratorNormalCompletion3 = true;
                _context.next = 18;
                break;

              case 29:
                _context.next = 35;
                break;

              case 31:
                _context.prev = 31;
                _context.t1 = _context["catch"](16);
                _didIteratorError3 = true;
                _iteratorError3 = _context.t1;

              case 35:
                _context.prev = 35;
                _context.prev = 36;

                if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                  _iterator3["return"]();
                }

              case 38:
                _context.prev = 38;

                if (!_didIteratorError3) {
                  _context.next = 41;
                  break;
                }

                throw _iteratorError3;

              case 41:
                return _context.finish(38);

              case 42:
                return _context.finish(35);

              case 43:
                if (responses.length) {
                  _context.next = 45;
                  break;
                }

                return _context.abrupt("return");

              case 45:
                return _context.abrupt("return", socket.send(_circularJson["default"].stringify(responses), msg_options));

              case 46:
                _context.next = 48;
                return _regenerator["default"].awrap(_this5._runMethod(parsedData, socket._id, ns));

              case 48:
                response = _context.sent;

                if (response) {
                  _context.next = 51;
                  break;
                }

                return _context.abrupt("return");

              case 51:
                return _context.abrupt("return", socket.send(_circularJson["default"].stringify(response), msg_options));

              case 52:
              case "end":
                return _context.stop();
            }
          }
        }, null, null, [[2, 6], [16, 31, 35, 43], [36,, 38, 42]]);
      });
    }
    /**
     * Runs a defined RPC method.
     * @private
     * @param {Object} message - a message received
     * @param {Object} socket_id - user's socket id
     * @param {String} ns - namespaces identifier
     * @return {Object|undefined}
     */

  }, {
    key: "_runMethod",
    value: function _runMethod(message, socket_id) {
      var ns,
          results,
          event_names,
          _iteratorNormalCompletion4,
          _didIteratorError4,
          _iteratorError4,
          _iterator4,
          _step4,
          name,
          index,
          namespace,
          socket_index,
          _results,
          _iteratorNormalCompletion5,
          _didIteratorError5,
          _iteratorError5,
          _iterator5,
          _step5,
          _name,
          _index,
          response,
          _args2 = arguments;

      return _regenerator["default"].async(function _runMethod$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              ns = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : "/";

              if (!((0, _typeof2["default"])(message) !== "object")) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32600),
                id: null
              });

            case 3:
              if (!(message.jsonrpc !== "2.0")) {
                _context2.next = 5;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32600, "Invalid JSON RPC version"),
                id: message.id || null
              });

            case 5:
              if (message.method) {
                _context2.next = 7;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32602, "Method not specified"),
                id: message.id || null
              });

            case 7:
              if (!(typeof message.method !== "string")) {
                _context2.next = 9;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32600, "Invalid method name"),
                id: message.id || null
              });

            case 9:
              if (!(message.params && typeof message.params === "string")) {
                _context2.next = 11;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32600),
                id: message.id || null
              });

            case 11:
              if (!(message.method === "rpc.on")) {
                _context2.next = 54;
                break;
              }

              if (message.params) {
                _context2.next = 14;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32000),
                id: message.id || null
              });

            case 14:
              results = {};
              event_names = Object.keys(this.namespaces[ns].events);
              _iteratorNormalCompletion4 = true;
              _didIteratorError4 = false;
              _iteratorError4 = undefined;
              _context2.prev = 19;
              _iterator4 = message.params[Symbol.iterator]();

            case 21:
              if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
                _context2.next = 37;
                break;
              }

              name = _step4.value;
              index = event_names.indexOf(name);
              namespace = this.namespaces[ns];

              if (!(index === -1)) {
                _context2.next = 28;
                break;
              }

              results[name] = "provided event invalid";
              return _context2.abrupt("continue", 34);

            case 28:
              socket_index = namespace.events[event_names[index]].indexOf(socket_id);

              if (!(socket_index >= 0)) {
                _context2.next = 32;
                break;
              }

              results[name] = "socket has already been subscribed to event";
              return _context2.abrupt("continue", 34);

            case 32:
              namespace.events[event_names[index]].push(socket_id);
              results[name] = "ok";

            case 34:
              _iteratorNormalCompletion4 = true;
              _context2.next = 21;
              break;

            case 37:
              _context2.next = 43;
              break;

            case 39:
              _context2.prev = 39;
              _context2.t0 = _context2["catch"](19);
              _didIteratorError4 = true;
              _iteratorError4 = _context2.t0;

            case 43:
              _context2.prev = 43;
              _context2.prev = 44;

              if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                _iterator4["return"]();
              }

            case 46:
              _context2.prev = 46;

              if (!_didIteratorError4) {
                _context2.next = 49;
                break;
              }

              throw _iteratorError4;

            case 49:
              return _context2.finish(46);

            case 50:
              return _context2.finish(43);

            case 51:
              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                result: results,
                id: message.id || null
              });

            case 54:
              if (!(message.method === "rpc.off")) {
                _context2.next = 94;
                break;
              }

              if (message.params) {
                _context2.next = 57;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32000),
                id: message.id || null
              });

            case 57:
              _results = {};
              _iteratorNormalCompletion5 = true;
              _didIteratorError5 = false;
              _iteratorError5 = undefined;
              _context2.prev = 61;
              _iterator5 = message.params[Symbol.iterator]();

            case 63:
              if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                _context2.next = 77;
                break;
              }

              _name = _step5.value;

              if (this.namespaces[ns].events[_name]) {
                _context2.next = 68;
                break;
              }

              _results[_name] = "provided event invalid";
              return _context2.abrupt("continue", 74);

            case 68:
              _index = this.namespaces[ns].events[_name].indexOf(socket_id);

              if (!(_index === -1)) {
                _context2.next = 72;
                break;
              }

              _results[_name] = "not subscribed";
              return _context2.abrupt("continue", 74);

            case 72:
              this.namespaces[ns].events[_name].splice(_index, 1);

              _results[_name] = "ok";

            case 74:
              _iteratorNormalCompletion5 = true;
              _context2.next = 63;
              break;

            case 77:
              _context2.next = 83;
              break;

            case 79:
              _context2.prev = 79;
              _context2.t1 = _context2["catch"](61);
              _didIteratorError5 = true;
              _iteratorError5 = _context2.t1;

            case 83:
              _context2.prev = 83;
              _context2.prev = 84;

              if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
                _iterator5["return"]();
              }

            case 86:
              _context2.prev = 86;

              if (!_didIteratorError5) {
                _context2.next = 89;
                break;
              }

              throw _iteratorError5;

            case 89:
              return _context2.finish(86);

            case 90:
              return _context2.finish(83);

            case 91:
              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                result: _results,
                id: message.id || null
              });

            case 94:
              if (!(message.method === "rpc.login")) {
                _context2.next = 97;
                break;
              }

              if (message.params) {
                _context2.next = 97;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32604),
                id: message.id || null
              });

            case 97:
              if (this.namespaces[ns].rpc_methods[message.method]) {
                _context2.next = 99;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32601),
                id: message.id || null
              });

            case 99:
              response = null; // reject request if method is protected and if client is not authenticated

              if (!(this.namespaces[ns].rpc_methods[message.method]["protected"] === true && this.authenticated === false)) {
                _context2.next = 102;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: utils.createError(-32605),
                id: message.id || null
              });

            case 102:
              _context2.prev = 102;
              _context2.next = 105;
              return _regenerator["default"].awrap(this.namespaces[ns].rpc_methods[message.method].fn(message.params));

            case 105:
              response = _context2.sent;
              _context2.next = 115;
              break;

            case 108:
              _context2.prev = 108;
              _context2.t2 = _context2["catch"](102);

              if (message.id) {
                _context2.next = 112;
                break;
              }

              return _context2.abrupt("return");

            case 112:
              if (!(_context2.t2 instanceof Error)) {
                _context2.next = 114;
                break;
              }

              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: {
                  code: -32000,
                  message: _context2.t2.name,
                  data: _context2.t2.message
                },
                id: message.id
              });

            case 114:
              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                error: _context2.t2,
                id: message.id
              });

            case 115:
              if (message.id) {
                _context2.next = 117;
                break;
              }

              return _context2.abrupt("return");

            case 117:
              // if login middleware returned true, set connection as authenticated
              if (message.method === "rpc.login" && response === true) this.authenticated = true;
              return _context2.abrupt("return", {
                jsonrpc: "2.0",
                result: response,
                id: message.id
              });

            case 119:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[19, 39, 43, 51], [44,, 46, 50], [61, 79, 83, 91], [84,, 86, 90], [102, 108]]);
    }
    /**
     * Generate a new namespace store.
     * Also preregister some special namespace methods.
     * @private
     * @param {String} name - namespaces identifier
     * @return {undefined}
     */

  }, {
    key: "_generateNamespace",
    value: function _generateNamespace(name) {
      var _this6 = this;

      this.namespaces[name] = {
        rpc_methods: {
          "__listMethods": {
            fn: function fn() {
              return Object.keys(_this6.namespaces[name].rpc_methods);
            },
            "protected": false
          }
        },
        clients: new Map(),
        events: {}
      };
    }
  }]);
  return Server;
}(_eventemitter.EventEmitter);

exports["default"] = Server;