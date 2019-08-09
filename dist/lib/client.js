/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertArgs = _interopRequireDefault(require("assert-args"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _circularJson = _interopRequireDefault(require("circular-json"));

var _default = function _default(WebSocket) {
  return (
    /*#__PURE__*/
    function (_EventEmitter) {
      (0, _inherits2["default"])(Client, _EventEmitter);

      /**
       * Instantiate a Client class.
       * @constructor
       * @param {String} address - url to a websocket server
       * @param {Object} options - ws options object with reconnect parameters
       * @param {Function} generate_request_id - custom generation request Id
       * @return {Client}
       */
      function Client() {
        var _this;

        var address = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8080";

        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$autoconnect = _ref.autoconnect,
            autoconnect = _ref$autoconnect === void 0 ? true : _ref$autoconnect,
            _ref$reconnect = _ref.reconnect,
            reconnect = _ref$reconnect === void 0 ? true : _ref$reconnect,
            _ref$reconnect_interv = _ref.reconnect_interval,
            reconnect_interval = _ref$reconnect_interv === void 0 ? 1000 : _ref$reconnect_interv,
            _ref$max_reconnects = _ref.max_reconnects,
            max_reconnects = _ref$max_reconnects === void 0 ? 5 : _ref$max_reconnects;

        var generate_request_id = arguments.length > 2 ? arguments[2] : undefined;
        (0, _classCallCheck2["default"])(this, Client);
        _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(Client).call(this));
        _this.rpc_methods = {};
        _this.queue = {};
        _this.rpc_id = 0;
        _this.address = address;
        _this.options = arguments[1];
        _this.autoconnect = autoconnect;
        _this.ready = false;
        _this.reconnect = reconnect;
        _this.reconnect_interval = reconnect_interval;
        _this.max_reconnects = max_reconnects;
        _this.current_reconnects = 0;

        _this.generate_request_id = generate_request_id || function () {
          return ++_this.rpc_id;
        };

        if (_this.autoconnect) _this._connect(_this.address, _this.options);
        return _this;
      }
      /**
       * Connects to a defined server if not connected already.
       * @method
       * @return {Undefined}
       */


      (0, _createClass2["default"])(Client, [{
        key: "connect",
        value: function connect() {
          if (this.socket) return;

          this._connect(this.address, this.options);
        }
        /**
         * Registers an RPC method.
         * @method
         * @param {String} name - method name
         * @param {Function} fn - a callee function
         * @throws {TypeError}
         * @return {Object} - returns the RPCMethod object
         */

      }, {
        key: "register",
        value: function register(name, fn) {
          var _this2 = this;

          (0, _assertArgs["default"])(arguments, {
            name: "string",
            fn: "function",
            "[ns]": "string"
          });
          this.rpc_methods[name] = {
            fn: fn,
            "protected": false
          };
          return {
            "protected": function _protected() {
              return _this2._makeProtected(name);
            },
            "public": function _public() {
              return _this2._makePublic(name);
            }
          };
        }
        /**
         * Sets an auth method.
         * @method
         * @param {Function} fn - an arbitrary auth method
         * @throws {TypeError}
         * @return {Undefined}
         */

      }, {
        key: "setAuth",
        value: function setAuth(fn) {
          this.register("rpc.login", fn);
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

      }, {
        key: "call",
        value: function call(method, params, timeout, ws_opts) {
          var _this3 = this;

          (0, _assertArgs["default"])(arguments, {
            "method": "string",
            "[params]": ["object", Array],
            "[timeout]": "number",
            "[ws_opts]": "object"
          });

          if (!ws_opts && "object" === (0, _typeof2["default"])(timeout)) {
            ws_opts = timeout;
            timeout = null;
          }

          return new Promise(function (resolve, reject) {
            if (!_this3.ready) return reject(new Error("socket not ready"));

            var rpc_id = _this3.generate_request_id(method, params);

            var message = {
              jsonrpc: "2.0",
              method: method,
              params: params || null,
              id: rpc_id
            };

            _this3.socket.send(JSON.stringify(message), ws_opts, function (error) {
              if (error) return reject(error);
              _this3.queue[rpc_id] = {
                promise: [resolve, reject]
              };

              if (timeout) {
                _this3.queue[rpc_id].timeout = setTimeout(function () {
                  _this3.queue[rpc_id] = null;
                  reject(new Error("reply timeout"));
                }, timeout);
              }
            });
          });
        }
        /**
         * Logins with the other side of the connection.
         * @method
         * @param {Object} params - Login credentials object
         * @return {Promise}
         */

      }, {
        key: "login",
        value: function () {
          var _login = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee(params) {
            return _regenerator["default"].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return this.call("rpc.login", params);

                  case 2:
                    return _context.abrupt("return", _context.sent);

                  case 3:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function login(_x) {
            return _login.apply(this, arguments);
          }

          return login;
        }()
        /**
         * Fetches a list of client's methods registered on server.
         * @method
         * @return {Array}
         */

      }, {
        key: "listMethods",
        value: function () {
          var _listMethods = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee2() {
            return _regenerator["default"].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.next = 2;
                    return this.call("__listMethods");

                  case 2:
                    return _context2.abrupt("return", _context2.sent);

                  case 3:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function listMethods() {
            return _listMethods.apply(this, arguments);
          }

          return listMethods;
        }()
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
          var _this4 = this;

          (0, _assertArgs["default"])(arguments, {
            "method": "string",
            "[params]": ["object", Array]
          });
          return new Promise(function (resolve, reject) {
            if (!_this4.ready) return reject(new Error("socket not ready"));
            var message = {
              jsonrpc: "2.0",
              method: method,
              params: params || null
            };

            _this4.socket.send(JSON.stringify(message), function (error) {
              if (error) return reject(error);
              resolve();
            });
          });
        }
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
          var _subscribe = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee3(event) {
            var result,
                _args3 = arguments;
            return _regenerator["default"].wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    (0, _assertArgs["default"])(_args3, {
                      event: ["string", Array]
                    });
                    if (typeof event === "string") event = [event];
                    _context3.next = 4;
                    return this.call("rpc.on", event);

                  case 4:
                    result = _context3.sent;

                    if (!(typeof event === "string" && result[event] !== "ok")) {
                      _context3.next = 7;
                      break;
                    }

                    throw new Error("Failed subscribing to an event '" + event + "' with: " + result[event]);

                  case 7:
                    return _context3.abrupt("return", result);

                  case 8:
                  case "end":
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));

          function subscribe(_x2) {
            return _subscribe.apply(this, arguments);
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
          var _unsubscribe = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee4(event) {
            var result,
                _args4 = arguments;
            return _regenerator["default"].wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    (0, _assertArgs["default"])(_args4, {
                      event: ["string", Array]
                    });
                    if (typeof event === "string") event = [event];
                    _context4.next = 4;
                    return this.call("rpc.off", event);

                  case 4:
                    result = _context4.sent;

                    if (!(typeof event === "string" && result[event] !== "ok")) {
                      _context4.next = 7;
                      break;
                    }

                    throw new Error("Failed unsubscribing from an event with: " + result);

                  case 7:
                    return _context4.abrupt("return", result);

                  case 8:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4, this);
          }));

          function unsubscribe(_x3) {
            return _unsubscribe.apply(this, arguments);
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
          var _this5 = this;

          this.socket = new WebSocket(address, options);
          this.socket.on("open", function () {
            _this5.ready = true;

            _this5.emit("open");

            _this5.current_reconnects = 0;
          });
          this.socket.on("message", function (message) {
            if (message instanceof ArrayBuffer) message = Buffer.from(message).toString();

            try {
              message = _circularJson["default"].parse(message);
            } catch (error) {
              return;
            } // check if any listeners are attached and forward event


            if (message.notification && _this5.listeners(message.notification).length) {
              if (!Object.keys(message.params).length) return _this5.emit(message.notification);
              var args = [message.notification];
              if (message.params.constructor === Object) args.push(message.params);else // using for-loop instead of unshift/spread because performance is better
                for (var i = 0; i < message.params.length; i++) {
                  args.push(message.params[i]);
                }
              return _this5.emit.apply(_this5, args);
            }

            if (!_this5.queue[message.id]) {
              // general JSON RPC 2.0 events
              if (message.method && message.params) return _this5.emit(message.method, message.params);else return;
            }

            if (_this5.queue[message.id].timeout) clearTimeout(_this5.queue[message.id].timeout);
            if (message.error) _this5.queue[message.id].promise[1](message.error);else _this5.queue[message.id].promise[0](message.result);
            _this5.queue[message.id] = null;
          });
          this.socket.on("error", function (error) {
            return _this5.emit("error", error);
          });
          this.socket.on("close", function (code, message) {
            if (_this5.ready) _this5.emit("close", code, message);
            _this5.ready = false;
            if (code === 1000) return;
            _this5.current_reconnects++;
            if (_this5.reconnect && (_this5.max_reconnects > _this5.current_reconnects || _this5.max_reconnects === 0)) setTimeout(function () {
              return _this5._connect(address, options);
            }, _this5.reconnect_interval);
          });
        }
        /**
         * Marks an RPC method as protected.
         * @method
         * @param {String} name - method name
         * @return {Undefined}
         */

      }, {
        key: "_makeProtected",
        value: function _makeProtected(name) {
          this.rpc_methods[name]["protected"] = true;
        }
        /**
         * Marks an RPC method as public.
         * @method
         * @param {String} name - method name
         * @return {Undefined}
         */

      }, {
        key: "_makePublic",
        value: function _makePublic(name) {
          this.rpc_methods[name]["protected"] = false;
        }
      }]);
      return Client;
    }(_eventemitter["default"])
  );
};

exports["default"] = _default;