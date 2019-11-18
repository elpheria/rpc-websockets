"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.TimeoutError = exports.RPCServerError = exports.RPC_ERRORS = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

var _jsonRpcMsg = _interopRequireDefault(require("json-rpc-msg"));

var _v = _interopRequireDefault(require("uuid/v1"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _circularJson = _interopRequireDefault(require("circular-json"));

// @ts-ignore

/**
 * List additional JSON RPC errors
 *
 * @type {object}
 */
var RPC_ERRORS = Object.assign(Object.assign({}, _jsonRpcMsg["default"].ERRORS), {
  INTERNAL_SERVER_ERROR: {
    code: -32000,
    message: "Internal server error"
  }
});
/**
 * Constructor of error object, that should be thrown if server responded with error
 *
 * @param {{code: int, message: string, data: *?}} error - error data
 *
 * @constructor
 */

exports.RPC_ERRORS = RPC_ERRORS;

var RPCServerError =
/*#__PURE__*/
function (_Error) {
  (0, _inherits2["default"])(RPCServerError, _Error);

  function RPCServerError(error) {
    var _this;

    (0, _classCallCheck2["default"])(this, RPCServerError);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(RPCServerError).call(this));
    _this.message = error.message;
    _this.code = error.code;
    _this.data = error.data;
    if (Error.captureStackTrace) Error.captureStackTrace((0, _assertThisInitialized2["default"])(_this), _this.constructor);else _this.stack = new Error().stack;
    return _this;
  }

  return RPCServerError;
}((0, _wrapNativeSuper2["default"])(Error));
/**
 * Constructor of error object, that should be thrown if response was not received in given time
 * @constructor
 *
 * @param {object} request - failed request object
 */


exports.RPCServerError = RPCServerError;

var TimeoutError =
/*#__PURE__*/
function (_Error2) {
  (0, _inherits2["default"])(TimeoutError, _Error2);

  function TimeoutError(request) {
    var _this2;

    (0, _classCallCheck2["default"])(this, TimeoutError);
    _this2 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(TimeoutError).call(this));
    _this2.message = "Request to method \"".concat(request.method, "\" timed out");
    if (Error.captureStackTrace) Error.captureStackTrace((0, _assertThisInitialized2["default"])(_this2), _this2.constructor);else _this2.stack = new Error().stack;
    return _this2;
  }

  return TimeoutError;
}((0, _wrapNativeSuper2["default"])(Error));
/**
 * Wrapper for WebSockets
 */


exports.TimeoutError = TimeoutError;

var JsonRPCSocket =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inherits2["default"])(JsonRPCSocket, _EventEmitter);

  function JsonRPCSocket(socket, id) {
    var _this3;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck2["default"])(this, JsonRPCSocket);
    _this3 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(JsonRPCSocket).call(this));
    _this3.options = {
      generate_request_id: options.generate_request_id || function () {
        return (0, _v["default"])();
      }
    };
    _this3._pendingRequests = new Map();
    _this3._id = id;
    _this3._socket = socket;

    _this3._socket.on("open", function () {
      var _this4;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return (_this4 = _this3).emit.apply(_this4, ["open"].concat(args));
    });

    _this3._socket.on("message", function (data) {
      _this3.emit("message", data);

      _this3._handleRpcMessage(data);
    });

    _this3._socket.on("close", function (code, reason) {
      return _this3.emit("close", code, reason);
    });

    _this3._socket.on("error", function () {
      var _this5;

      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return (_this5 = _this3).emit.apply(_this5, ["error"].concat(args));
    });

    return _this3;
  }
  /**
   * RPC message handler
   * @param {string|Buffer} data - received message
   * @returns {Promise<void>}
   * @private
   */


  (0, _createClass2["default"])(JsonRPCSocket, [{
    key: "_handleRpcMessage",
    value: function _handleRpcMessage(data) {
      var _this6 = this;

      var msg_options, message, rpcError, result, batch, results;
      return _regenerator["default"].async(function _handleRpcMessage$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              msg_options = {
                binary: false
              }; // Convert binary messages to string:

              if (data instanceof Buffer || data instanceof ArrayBuffer) {
                msg_options.binary = true;
                data = Buffer.from(data).toString();
              } // try to parse received JSON string:


              _context.prev = 2;

              if (!(typeof data === "string")) {
                _context.next = 11;
                break;
              }

              _context.prev = 4;
              data = _circularJson["default"].parse(data);
              _context.next = 11;
              break;

            case 8:
              _context.prev = 8;
              _context.t0 = _context["catch"](4);
              throw new _jsonRpcMsg["default"].ParserError(_jsonRpcMsg["default"].createError(null, RPC_ERRORS.PARSE_ERROR));

            case 11:
              // Parse RPC message:
              message = _jsonRpcMsg["default"].parseMessage(data);
              _context.next = 21;
              break;

            case 14:
              _context.prev = 14;
              _context.t1 = _context["catch"](2);
              // If there was an error in
              rpcError = _context.t1 instanceof _jsonRpcMsg["default"].ParserError ? _context.t1.rpcError : _jsonRpcMsg["default"].createError(null, RPC_ERRORS.INTERNAL_SERVER_ERROR);
              this.send(rpcError, msg_options); // If it's some javascipt error - throw it up:

              if (_context.t1 instanceof _jsonRpcMsg["default"].ParserError) {
                _context.next = 20;
                break;
              }

              throw _context.t1;

            case 20:
              return _context.abrupt("return");

            case 21:
              _context.t2 = message.type;
              _context.next = _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.REQUEST ? 24 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_REQUEST ? 24 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.NOTIFICATION ? 29 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_NOTIFICATION ? 29 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.ERROR ? 31 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.RESPONSE ? 31 : _context.t2 === _jsonRpcMsg["default"].MESSAGE_TYPES.BATCH ? 33 : 40;
              break;

            case 24:
              _context.next = 26;
              return _regenerator["default"].awrap(this._handleIncomingRequest(message));

            case 26:
              result = _context.sent;
              this.send(result, msg_options);
              return _context.abrupt("break", 41);

            case 29:
              this._handleIncomingNotification(message);

              return _context.abrupt("break", 41);

            case 31:
              this._handleRPCResponse(message.payload);

              return _context.abrupt("break", 41);

            case 33:
              batch = message.payload;
              _context.next = 36;
              return _regenerator["default"].awrap(Promise.all(batch.map(function (msg) {
                // If current item of batch is invalid rpc-request - return RPC-response with error:
                if (msg instanceof _jsonRpcMsg["default"].ParserError) {
                  return msg.rpcError;
                } // If current item of batch is a notification - do nothing with it:


                if (msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.NOTIFICATION || msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_NOTIFICATION) {
                  _this6._handleIncomingNotification(msg);

                  return;
                } // If current item of batch is not a request - do nothing with it:
                else if (msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.REQUEST || msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_REQUEST) {
                    return _this6._handleIncomingRequest(msg);
                  } else if (msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.ERROR || msg.type === _jsonRpcMsg["default"].MESSAGE_TYPES.RESPONSE) {
                    _this6._handleRPCResponse(msg.payload);
                  } else throw new Error("Unknown type of message in batch: \"".concat(msg.type, "\""));
              })));

            case 36:
              results = _context.sent;
              results = results.filter(function (result) {
                return typeof result !== "undefined";
              });
              this.send(results, msg_options);
              return _context.abrupt("break", 41);

            case 40:
              throw new Error("Unsupported type of message ".concat(message.type, ". ") + "Supported types: ".concat(Object.values(_jsonRpcMsg["default"].MESSAGE_TYPES).join(", ")));

            case 41:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[2, 14], [4, 8]]);
    }
    /**
     * Handle incoming notification
     * @param {object} message - received parsed message
     * @returns {void}
     * @private
     */

  }, {
    key: "_handleIncomingNotification",
    value: function _handleIncomingNotification(message) {
      var notificationType = null;
      if (message.type === _jsonRpcMsg["default"].MESSAGE_TYPES.NOTIFICATION) notificationType = "rpc:notification";else if (message.type === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_NOTIFICATION) notificationType = "rpc:internal:notification";else throw new Error("Unsupported type of notification: ".concat(message.type));
      this.emit(notificationType, message.payload, this);
      this.emit("".concat(notificationType, ":").concat(message.payload.method), message.payload.params, this);
    }
    /**
     * Handle incoming request
     * @param {object} message - parsed JSON-RPC request
     * @returns {Promise.<object>} - promise that on fullfilled returns JSON-RPC message
     * @private
     */

  }, {
    key: "_handleIncomingRequest",
    value: function _handleIncomingRequest(message) {
      var _this7 = this;

      var eventName, waitForResponse;
      return _regenerator["default"].async(function _handleIncomingRequest$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              eventName = "";

              if (!(message.type === _jsonRpcMsg["default"].MESSAGE_TYPES.REQUEST)) {
                _context2.next = 5;
                break;
              }

              eventName = "rpc:request";
              _context2.next = 10;
              break;

            case 5:
              if (!(message.type === _jsonRpcMsg["default"].MESSAGE_TYPES.INTERNAL_REQUEST)) {
                _context2.next = 9;
                break;
              }

              eventName = "rpc:internal:request";
              _context2.next = 10;
              break;

            case 9:
              throw new Error("Unsupported type of request: ".concat(message.type));

            case 10:
              // Wait for response:
              waitForResponse = new Promise(function (resolve) {
                var isFullfilled = false;
                var res = {
                  isSent: function isSent() {
                    return isFullfilled;
                  },
                  send: function send(response) {
                    resolve({
                      type: "response",
                      data: response
                    });
                    isFullfilled = true;
                  },
                  "throw": function _throw(error, additionalData) {
                    resolve({
                      type: "error",
                      data: {
                        error: error,
                        additionalData: additionalData
                      }
                    });
                    isFullfilled = true;
                  }
                };

                var hasListeners = _this7.emit(eventName, message.payload, res, _this7);

                if (!hasListeners) res["throw"](RPC_ERRORS.METHOD_NOT_FOUND);
              }); // Parse response results and convert it to RPC message:

              _context2.next = 13;
              return _regenerator["default"].awrap(waitForResponse.then(function (result) {
                if (result.type === "error") {
                  return _jsonRpcMsg["default"].createError(message.payload.id, result.data.error, result.data.additionalData);
                } else {
                  return _jsonRpcMsg["default"].createResponse(message.payload.id, result.data);
                }
              }, function () {
                return _jsonRpcMsg["default"].createError(message.payload.id, RPC_ERRORS.INTERNAL_SERVER_ERROR);
              }));

            case 13:
              return _context2.abrupt("return", _context2.sent);

            case 14:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
    /**
     * Call remote method
     * @param {boolean} isInternal - should internal method be called or public
     * @param {string} method - method name to call
     * @param {object|array} params? - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response (ms)
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */

  }, {
    key: "_callMethod",
    value: function _callMethod(isInternal, method, params) {
      var _this8 = this;

      var waitTime,
          wsOptions,
          _args3 = arguments;
      return _regenerator["default"].async(function _callMethod$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              waitTime = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : 60000;
              wsOptions = _args3.length > 4 ? _args3[4] : undefined;
              return _context3.abrupt("return", new Promise(function (_resolve, _reject) {
                // Generate request id:
                var id = _this8.options.generate_request_id(method, params); // Build temporary request signature to help resolve and reject request and control
                // it's life time:


                var request = {
                  timer: isFinite(waitTime) ? setTimeout(function () {
                    return request.promise.reject(new TimeoutError({
                      method: method,
                      params: params
                    }));
                  }, waitTime) : null,
                  promise: {
                    resolve: function resolve(data) {
                      _resolve(data);

                      _this8._pendingRequests["delete"](id);
                    },
                    reject: function reject(err) {
                      _reject(err);

                      _this8._pendingRequests["delete"](id);
                    }
                  }
                }; // Send request:

                var requestObj = isInternal ? _jsonRpcMsg["default"].createInternalRequest(id, method, params) : _jsonRpcMsg["default"].createRequest(id, method, params);

                _this8.send(requestObj, wsOptions, function (error) {
                  if (error) return request.promise.reject(error); // Store request in "pending requests" registry:

                  _this8._pendingRequests.set(id, request);
                });
              }));

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
    /**
     * Handle response from server
     *
     * @param {object} responseData - response data
     * @param {string|number} id - request ID
     * @param {*} result - result if response successful
     * @param {{code: number, message: string, data: (array|object)}} error - error
     *
     * @returns {void}
     *
     * @private
     */

  }, {
    key: "_handleRPCResponse",
    value: function _handleRPCResponse(responseData) {
      var id = responseData.id,
          result = responseData.result,
          error = responseData.error;

      var pendingRequest = this._pendingRequests.get(id);

      if (!pendingRequest) return;
      if (error) pendingRequest.promise.reject(new RPCServerError(error));else pendingRequest.promise.resolve(result);
    }
    /**
     * Returns ID of the socket
     *
     * @returns {number|string}
     */

  }, {
    key: "getId",
    value: function getId() {
      return this._id;
    }
    /**
     * Returns native websocket object
     *
     * @returns {WebSocket}
     */

  }, {
    key: "getSocket",
    value: function getSocket() {
      return this._socket;
    }
    /**
     * Close the socket
     * @param {Number} code? - A numeric value indicating the status code
     *                        explaining why the connection is being closed.
     * @param {String} reason? - A human-readable string explaining why the connection is closing.
     * @returns {void}
     */

  }, {
    key: "close",
    value: function close() {
      var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;
      var reason = arguments.length > 1 ? arguments[1] : undefined;

      this._socket.close(code, reason);
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
    value: function callMethod(method, params, waitTime, wsOptions) {
      return _regenerator["default"].async(function callMethod$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt("return", this._callMethod(false, method, params, waitTime, wsOptions));

            case 1:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
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
    value: function callInternalMethod(method, params, waitTime, wsOptions) {
      return _regenerator["default"].async(function callInternalMethod$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              return _context5.abrupt("return", this._callMethod(true, method, params, waitTime, wsOptions));

            case 1:
            case "end":
              return _context5.stop();
          }
        }
      }, null, this);
    }
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */

  }, {
    key: "listRemoteMethods",
    value: function listRemoteMethods() {
      return _regenerator["default"].async(function listRemoteMethods$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              return _context6.abrupt("return", this.callInternalMethod("listMethods"));

            case 1:
            case "end":
              return _context6.stop();
          }
        }
      }, null, this);
    }
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */

  }, {
    key: "listRemoteEvents",
    value: function listRemoteEvents() {
      return _regenerator["default"].async(function listRemoteEvents$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt("return", this.callInternalMethod("listEvents"));

            case 1:
            case "end":
              return _context7.stop();
          }
        }
      }, null, this);
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
    value: function sendNotification(method, params) {
      var _this9 = this;

      var notificationObject;
      return _regenerator["default"].async(function sendNotification$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              notificationObject = _jsonRpcMsg["default"].createNotification(method, params);
              return _context8.abrupt("return", new Promise(function (resolve, reject) {
                _this9.send(notificationObject, function (error) {
                  if (error) reject(error);
                  resolve();
                });
              }));

            case 2:
            case "end":
              return _context8.stop();
          }
        }
      });
    }
    /**
     * Sends given internal notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */

  }, {
    key: "sendInternalNotification",
    value: function sendInternalNotification(method, params) {
      var _this10 = this;

      var notificationObject;
      return _regenerator["default"].async(function sendInternalNotification$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              notificationObject = _jsonRpcMsg["default"].createInternalNotification(method, params);
              return _context9.abrupt("return", new Promise(function (resolve, reject) {
                _this10.send(notificationObject, function (error) {
                  if (error) reject(error);
                  resolve();
                });
              }));

            case 2:
            case "end":
              return _context9.stop();
          }
        }
      });
    }
    /**
     * Send given data
     *
     * @param {any} data - data to be sent
     * @param {object} options - options for websocket protocol
     * @param {function} cb - callback that will be invoked when data is sent
     *
     * @returns {*}
     */

  }, {
    key: "send",
    value: function send(data, options, cb) {
      if (data && (0, _typeof2["default"])(data) === "object" && !(data instanceof ArrayBuffer) && !(data instanceof Buffer)) {
        data = _circularJson["default"].stringify(data);
      } // @ts-ignore


      return this._socket.send(data, options, cb);
    }
  }]);
  return JsonRPCSocket;
}(_eventemitter["default"]);

exports["default"] = JsonRPCSocket;
JsonRPCSocket.TimeoutError = TimeoutError;
JsonRPCSocket.RPCServerError = RPCServerError;
JsonRPCSocket.RPC_ERRORS = RPC_ERRORS;