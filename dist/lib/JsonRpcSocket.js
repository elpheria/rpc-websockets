"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RPC_ERRORS = undefined;

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

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

var _create = require("babel-runtime/core-js/object/create");

var _create2 = _interopRequireDefault(_create);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.RPCServerError = RPCServerError;
exports.TimeoutError = TimeoutError;

var _jsonRpcMsg = require("json-rpc-msg");

var _jsonRpcMsg2 = _interopRequireDefault(_jsonRpcMsg);

var _v = require("uuid/v1");

var _v2 = _interopRequireDefault(_v);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _circularJson = require("circular-json");

var _circularJson2 = _interopRequireDefault(_circularJson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * List additional JSON RPC errors
 *
 * @type {object}
 */
var RPC_ERRORS = exports.RPC_ERRORS = (0, _extends3.default)({}, _jsonRpcMsg2.default.ERRORS, {
    INTERNAL_SERVER_ERROR: {
        code: -32000,
        message: "Internal server error"
    }

    /**
     * Constructor of error object, that should be thrown if server responded with error
     *
     * @param {{code: int, message: string, data: *?}} error - error data
     *
     * @constructor
     */
});function RPCServerError(error) {
    this.message = error.message;
    this.name = this.constructor.name;
    this.code = error.code;
    this.data = error.data;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);else this.stack = new Error().stack;
}
RPCServerError.prototype = (0, _create2.default)(Error.prototype);
RPCServerError.prototype.constructor = RPCServerError;

/**
 * Constructor of error object, that should be thrown if response was not received in given time
 * @constructor
 *
 * @param {object} request - failed request object
 */
function TimeoutError(request) {
    this.message = "Request to method \"" + request.method + "\" timed out";
    this.name = this.constructor.name;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);else this.stack = new Error().stack;
}
TimeoutError.prototype = (0, _create2.default)(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;

/**
 * Wrapper for WebSockets
 */

var JsonRPCSocket = function (_EventEmitter) {
    (0, _inherits3.default)(JsonRPCSocket, _EventEmitter);

    function JsonRPCSocket(socket, id) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        (0, _classCallCheck3.default)(this, JsonRPCSocket);

        var _this = (0, _possibleConstructorReturn3.default)(this, (JsonRPCSocket.__proto__ || (0, _getPrototypeOf2.default)(JsonRPCSocket)).call(this));

        _this.options = {
            generate_request_id: options.generate_request_id || _v2.default
        };
        _this._pendingRequests = new _map2.default();
        _this._id = id;
        _this._socket = socket;
        _this._socket.on("open", function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return _this.emit.apply(_this, ["open"].concat(args));
        });
        _this._socket.on("message", function (data) {
            _this.emit("message", data);
            _this._handleRpcMessage(data);
        });
        _this._socket.on("close", function (code, reason) {
            return _this.emit("close", code, reason);
        });
        _this._socket.on("error", function () {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return _this.emit.apply(_this, ["error"].concat(args));
        });
        return _this;
    }

    /**
     * RPC message handler
     * @param {string|Buffer} data - received message
     * @returns {Promise<void>}
     * @private
     */


    (0, _createClass3.default)(JsonRPCSocket, [{
        key: "_handleRpcMessage",
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(data) {
                var _this2 = this;

                var msg_options, message, rpcError, result, batch, results;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                msg_options = {};

                                // Convert binary messages to string:

                                if (data instanceof Buffer || data instanceof ArrayBuffer) {
                                    msg_options.binary = true;
                                    data = Buffer.from(data).toString();
                                }

                                // try to parse received JSON string:
                                message = void 0;
                                _context.prev = 3;

                                if (!(typeof data === "string")) {
                                    _context.next = 12;
                                    break;
                                }

                                _context.prev = 5;

                                data = _circularJson2.default.parse(data);
                                _context.next = 12;
                                break;

                            case 9:
                                _context.prev = 9;
                                _context.t0 = _context["catch"](5);
                                throw new _jsonRpcMsg2.default.ParserError(_jsonRpcMsg2.default.createError(null, RPC_ERRORS.PARSE_ERROR));

                            case 12:
                                // Parse RPC message:
                                message = _jsonRpcMsg2.default.parseMessage(data);
                                _context.next = 22;
                                break;

                            case 15:
                                _context.prev = 15;
                                _context.t1 = _context["catch"](3);

                                // If there was an error in
                                rpcError = _context.t1 instanceof _jsonRpcMsg2.default.ParserError ? _context.t1.rpcError : _jsonRpcMsg2.default.createError(null, RPC_ERRORS.INTERNAL_SERVER_ERROR);

                                this.send(rpcError, msg_options);

                                // If it's some javascipt error - throw it up:

                                if (_context.t1 instanceof _jsonRpcMsg2.default.ParserError) {
                                    _context.next = 21;
                                    break;
                                }

                                throw _context.t1;

                            case 21:
                                return _context.abrupt("return");

                            case 22:
                                _context.t2 = message.type;
                                _context.next = _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.REQUEST ? 25 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_REQUEST ? 25 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.NOTIFICATION ? 30 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_NOTIFICATION ? 30 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.ERROR ? 32 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.RESPONSE ? 32 : _context.t2 === _jsonRpcMsg2.default.MESSAGE_TYPES.BATCH ? 34 : 41;
                                break;

                            case 25:
                                _context.next = 27;
                                return this._handleIncomingRequest(message);

                            case 27:
                                result = _context.sent;

                                this.send(result, msg_options);
                                return _context.abrupt("break", 42);

                            case 30:
                                this._handleIncomingNotification(message);
                                return _context.abrupt("break", 42);

                            case 32:
                                this._handleRPCResponse(message.payload);
                                return _context.abrupt("break", 42);

                            case 34:
                                batch = message.payload;
                                _context.next = 37;
                                return _promise2.default.all(batch.map(function (msg) {
                                    // If current item of batch is invalid rpc-request - return RPC-response with error:
                                    if (msg instanceof _jsonRpcMsg2.default.ParserError) {
                                        return msg.rpcError;
                                    }
                                    // If current item of batch is a notification - do nothing with it:
                                    if (msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.NOTIFICATION || msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_NOTIFICATION) {
                                        _this2._handleIncomingNotification(msg);
                                        return;
                                    }
                                    // If current item of batch is not a request - do nothing with it:
                                    else if (msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.REQUEST || msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_REQUEST) {
                                            return _this2._handleIncomingRequest(msg);
                                        } else if (msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.ERROR || msg.type === _jsonRpcMsg2.default.MESSAGE_TYPES.RESPONSE) {
                                            _this2._handleRPCResponse(msg.payload);
                                        } else throw new Error("Unknown type of message in batch: \"" + msg.type + "\"");
                                }));

                            case 37:
                                results = _context.sent;


                                results = results.filter(function (result) {
                                    return typeof result !== "undefined";
                                });
                                this.send(results, msg_options);
                                return _context.abrupt("break", 42);

                            case 41:
                                throw new Error("Unsupported type of message " + message.type + ". " + ("Supported types: " + (0, _values2.default)(_jsonRpcMsg2.default.MESSAGE_TYPES).join(", ")));

                            case 42:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[3, 15], [5, 9]]);
            }));

            function _handleRpcMessage(_x2) {
                return _ref.apply(this, arguments);
            }

            return _handleRpcMessage;
        }()

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
            if (message.type === _jsonRpcMsg2.default.MESSAGE_TYPES.NOTIFICATION) notificationType = "rpc:notification";else if (message.type === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_NOTIFICATION) notificationType = "rpc:internal:notification";else throw new Error("Unsupported type of notification: " + message.type);

            this.emit(notificationType, message.payload, this);
            this.emit(notificationType + ":" + message.payload.method, message.payload.params, this);
        }

        /**
         * Handle incoming request
         * @param {object} message - parsed JSON-RPC request
         * @returns {Promise.<object>} - promise that on fullfilled returns JSON-RPC message
         * @private
         */

    }, {
        key: "_handleIncomingRequest",
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(message) {
                var _this3 = this;

                var eventName, waitForResponse;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                eventName = null;

                                if (!(message.type === _jsonRpcMsg2.default.MESSAGE_TYPES.REQUEST)) {
                                    _context2.next = 5;
                                    break;
                                }

                                eventName = "rpc:request";
                                _context2.next = 10;
                                break;

                            case 5:
                                if (!(message.type === _jsonRpcMsg2.default.MESSAGE_TYPES.INTERNAL_REQUEST)) {
                                    _context2.next = 9;
                                    break;
                                }

                                eventName = "rpc:internal:request";
                                _context2.next = 10;
                                break;

                            case 9:
                                throw new Error("Unsupported type of request: " + message.type);

                            case 10:

                                // Wait for response:
                                waitForResponse = new _promise2.default(function (resolve) {
                                    var isFullfilled = false;
                                    var res = {
                                        isSent: function isSent() {
                                            return isFullfilled;
                                        },
                                        send: function send(response) {
                                            resolve({ type: "response", data: response });
                                            isFullfilled = true;
                                        },
                                        throw: function _throw(error, additionalData) {
                                            resolve({ type: "error", data: { error: error, additionalData: additionalData } });
                                            isFullfilled = true;
                                        }
                                    };
                                    var hasListeners = _this3.emit(eventName, message.payload, res, _this3);
                                    if (!hasListeners) res.throw(RPC_ERRORS.METHOD_NOT_FOUND);
                                });

                                // Parse response results and convert it to RPC message:

                                _context2.next = 13;
                                return waitForResponse.then(function (result) {
                                    if (result.type === "error") {
                                        return _jsonRpcMsg2.default.createError(message.payload.id, result.data.error, result.data.additionalData);
                                    } else {
                                        return _jsonRpcMsg2.default.createResponse(message.payload.id, result.data);
                                    }
                                }, function () {
                                    return _jsonRpcMsg2.default.createError(message.payload.id, RPC_ERRORS.INTERNAL_SERVER_ERROR);
                                });

                            case 13:
                                return _context2.abrupt("return", _context2.sent);

                            case 14:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _handleIncomingRequest(_x3) {
                return _ref2.apply(this, arguments);
            }

            return _handleIncomingRequest;
        }()

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
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(isInternal, method, params) {
                var _this4 = this;

                var waitTime = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 60000;
                var wsOptions = arguments[4];
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                return _context3.abrupt("return", new _promise2.default(function (_resolve, _reject) {
                                    // Generate request id:
                                    var id = _this4.options.generate_request_id();

                                    // Build temporary request signature to help resolve and reject request and control
                                    // it's life time:
                                    var request = {
                                        timer: isFinite(waitTime) ? setTimeout(function () {
                                            return request.promise.reject(new TimeoutError({ method: method, params: params }));
                                        }, waitTime) : null,
                                        promise: {
                                            resolve: function resolve(data) {
                                                _resolve(data);
                                                _this4._pendingRequests.delete(id);
                                            },
                                            reject: function reject(err) {
                                                _reject(err);
                                                _this4._pendingRequests.delete(id);
                                            }
                                        }

                                        // Send request:
                                    };var requestObj = isInternal ? _jsonRpcMsg2.default.createInternalRequest(id, method, params) : _jsonRpcMsg2.default.createRequest(id, method, params);

                                    _this4.send(requestObj, wsOptions, function (error) {
                                        if (error) return request.promise.reject(error);

                                        // Store request in "pending requests" registry:
                                        _this4._pendingRequests.set(id, request);
                                    });
                                }));

                            case 1:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function _callMethod(_x5, _x6, _x7) {
                return _ref3.apply(this, arguments);
            }

            return _callMethod;
        }()

        /**
         * Handle response from server
         *
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
        value: function _handleRPCResponse(_ref4) {
            var id = _ref4.id,
                result = _ref4.result,
                error = _ref4.error;

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
            var reason = arguments[1];

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
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(method, params, waitTime, wsOptions) {
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                return _context4.abrupt("return", this._callMethod(false, method, params, waitTime, wsOptions));

                            case 1:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function callMethod(_x9, _x10, _x11, _x12) {
                return _ref5.apply(this, arguments);
            }

            return callMethod;
        }()

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
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(method, params, waitTime, wsOptions) {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                return _context5.abrupt("return", this._callMethod(true, method, params, waitTime, wsOptions));

                            case 1:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function callInternalMethod(_x13, _x14, _x15, _x16) {
                return _ref6.apply(this, arguments);
            }

            return callInternalMethod;
        }()

        /**
         * Retrieve list of remote methods
         *
         * @returns {Promise<array<string>>}
         */

    }, {
        key: "listRemoteMethods",
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                return _context6.abrupt("return", this.callInternalMethod("listMethods"));

                            case 1:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function listRemoteMethods() {
                return _ref7.apply(this, arguments);
            }

            return listRemoteMethods;
        }()

        /**
         * Retrieve list of remote methods
         *
         * @returns {Promise<array<string>>}
         */

    }, {
        key: "listRemoteEvents",
        value: function () {
            var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                return _context7.abrupt("return", this.callInternalMethod("listEvents"));

                            case 1:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function listRemoteEvents() {
                return _ref8.apply(this, arguments);
            }

            return listRemoteEvents;
        }()

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
            var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(method, params) {
                var _this5 = this;

                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                return _context8.abrupt("return", new _promise2.default(function (resolve, reject) {
                                    _this5.send(_jsonRpcMsg2.default.createNotification(method, params), function (error) {
                                        if (error) reject(error);
                                        resolve();
                                    });
                                }));

                            case 1:
                            case "end":
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
            }));

            function sendNotification(_x17, _x18) {
                return _ref9.apply(this, arguments);
            }

            return sendNotification;
        }()

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
        value: function () {
            var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(method, params) {
                var _this6 = this;

                return _regenerator2.default.wrap(function _callee9$(_context9) {
                    while (1) {
                        switch (_context9.prev = _context9.next) {
                            case 0:
                                return _context9.abrupt("return", new _promise2.default(function (resolve, reject) {
                                    _this6.send(_jsonRpcMsg2.default.createInternalNotification(method, params), function (error) {
                                        if (error) reject(error);
                                        resolve();
                                    });
                                }));

                            case 1:
                            case "end":
                                return _context9.stop();
                        }
                    }
                }, _callee9, this);
            }));

            function sendInternalNotification(_x19, _x20) {
                return _ref10.apply(this, arguments);
            }

            return sendInternalNotification;
        }()

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
            if (data && (typeof data === "undefined" ? "undefined" : (0, _typeof3.default)(data)) === "object" && !(data instanceof ArrayBuffer) && !(data instanceof Buffer)) {
                data = _circularJson2.default.stringify(data);
            }
            return this._socket.send(data, options, cb);
        }
    }]);
    return JsonRPCSocket;
}(_eventemitter2.default);

exports.default = JsonRPCSocket;