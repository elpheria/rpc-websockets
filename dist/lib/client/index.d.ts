/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */
import EventEmitter from "eventemitter3";
import { TimeoutError, RPCServerError } from "../JsonRpcSocket";
import { TRpcNotificationHandler, TRpcNotificationName, TRpcNotificationParams, TRpcRequestHandler, TRpcRequestName, TRpcRequestParams } from "../JsonRpcSocket/types";
import { BrowserWebSocketTypeOptions, ICommonWebSocketFactory } from "../common.types";
export default class CommonClient extends EventEmitter {
    static RPCResponseTimeoutError: typeof TimeoutError;
    static RPCServerError: typeof RPCServerError;
    private wsOptions;
    private options;
    private _webSocketFactory;
    private _ready;
    private _currentReconnects;
    private _rpcSocket;
    private _namespace;
    /**
     * Instantiate a Client class.
     * @constructor
     * @param {webSocketFactory} webSocketFactory - factory method for WebSocket
     * @param {String} address - url to a websocket server
     * @param {Object} options - ws options object with reconnect parameters
     * @param {Function} generate_request_id - custom generation request Id
     * @return {CommonClient}
     */
    constructor(webSocketFactory: ICommonWebSocketFactory, address?: string, { autoconnect, reconnect, reconnect_interval, max_reconnects, strict_subscriptions }?: {
        autoconnect?: boolean;
        reconnect?: boolean;
        reconnect_interval?: number;
        max_reconnects?: number;
        strict_subscriptions?: boolean;
    }, generate_request_id?: (method: string, params: object | Array<any>) => number);
    /**
     * Connection/Message handler.
     * @method
     * @private
     * @param {String} address - WebSocket API address
     * @param {Object} options - ws options object
     * @return {Undefined}
     */
    _connect(address: string, options: BrowserWebSocketTypeOptions): void;
    /**
     * Connects to a defined server if not connected already.
     * @method
     * @return {Undefined}
     */
    connect(): Promise<unknown>;
    /**
     * Closes a WebSocket connection gracefully.
     * @method
     * @param {Number} code - socket close code
     * @param {String} data - optional data to be sent before closing
     * @return {Undefined}
     */
    close(code: number, data?: any): void;
    _updateSubscription(subscribe: boolean, events: string | string[]): Promise<any>;
    /**
     * Subscribes for a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    subscribe(event: string | Array<string>): Promise<any>;
    /**
     * Unsubscribes from a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    unsubscribe(event: string | Array<string>): Promise<any>;
    /**
     * Retrieve list of remote events
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteEvents(): Promise<Array<string>>;
    /**
     * Creates a new notification that can be emitted to clients.
     *
     * @param {String|array<string>} name - notification name
     *
     * @throws {TypeError}
     *
     * @return {Undefined}
     */
    registerNotification(name: TRpcNotificationName | Array<TRpcNotificationName>): void;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void;
    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredNotifications(): string[];
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
    onNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
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
    onceNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
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
    offNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendNotification(method: TRpcNotificationName, params?: TRpcNotificationParams): Promise<unknown>;
    /**
     * Creates a new internal notification that can be emitted to clients.
     *
     * @param {string|array<string>} name - notification name
     *
     * @return {Undefined}
     */
    registerInternalNotification(name: TRpcNotificationName | Array<TRpcNotificationName>): void;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterInternalNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void;
    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications(): string[];
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
    onInternalNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
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
    onceInternalNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
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
    offInternalNotification(notification: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendInternalNotification(method: TRpcNotificationName, params?: TRpcNotificationParams): Promise<unknown>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteMethods(): Promise<string[]>;
    /**
     * Registers an RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     *
     * @returns {void}
     */
    registerMethod(name: TRpcRequestName, fn: TRpcRequestHandler): void;
    /**
     * Unregister an RPC method
     *
     * @param {string} name - method name
     *
     * @returns {void}
     */
    unregisterMethod(name: TRpcRequestName): void;
    /**
     * Returns list of registered methods names
     *
     * @returns {Array<string>}
     */
    getRegisteredMethodsNames(): string[];
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): Promise<any>;
    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     *
     * @returns {void}
     */
    registerInternalMethod(name: TRpcRequestName, fn: TRpcRequestHandler): void;
    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     *
     * @returns {void}
     */
    unregisterInternalMethod(name: TRpcRequestName): void;
    /**
     * Returns list of registered internal methods
     *
     * @returns {Array<string>}
     */
    getRegisteredInternalMethodsNames(): string[];
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callInternalMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): Promise<any>;
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
    call(method: TRpcRequestName, params?: TRpcRequestParams, timeout?: number, ws_opts?: object): Promise<any>;
    /**
     * Fetches a list of client's methods registered on server.
     * @method
     * @return {Array}
     * @deprecated
     */
    listMethods(): Promise<string[]>;
    /**
     * Sends a JSON-RPC 2.0 notification to server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object} params - optional method parameters
     * @return {Promise}
     * @deprecated
     */
    notify(method: TRpcNotificationName, params?: TRpcNotificationParams): Promise<void>;
}
