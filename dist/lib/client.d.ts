/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */
import EventEmitter from "eventemitter3";
import { TimeoutError, RPCServerError } from "./JsonRpcSocket";
export default class CommonClient extends EventEmitter {
    static RPCResponseTimeoutError: typeof TimeoutError;
    static RPCServerError: typeof RPCServerError;
    /**
     * Instantiate a Client class.
     * @constructor
     * @param {webSocketFactory} webSocketFactory - factory method for WebSocket
     * @param {String} address - url to a websocket server
     * @param {Object} options - ws options object with reconnect parameters
     * @param {Function} generate_request_id - custom generation request Id
     * @return {CommonClient}
     */
    constructor(webSocketFactory: any, address: string, { autoconnect, reconnect, reconnect_interval, max_reconnects, strict_subscriptions }: {
        autoconnect?: boolean;
        reconnect?: boolean;
        reconnect_interval?: number;
        max_reconnects?: number;
        strict_subscriptions?: boolean;
    }, generate_request_id: any);
    /**
     * Connection/Message handler.
     * @method
     * @private
     * @param {String} address - WebSocket API address
     * @param {Object} options - ws options object
     * @return {Undefined}
     */
    _connect(address: any, options: any): void;
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
    close(code: any, data: any): void;
    _updateSubscription(subscribe: any, events: any): Promise<any>;
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
    listRemoteEvents(): Promise<any>;
    /**
     * Creates a new notification that can be emitted to clients.
     *
     * @param {String|array<string>} name - notification name
     *
     * @throws {TypeError}
     *
     * @return {Undefined}
     */
    registerNotification(name: any): any;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterNotification(names: any): any;
    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredNotifications(): any;
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
    onNotification(notification: any, handler: any): any;
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
    onceNotification(notification: any, handler: any): any;
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
    offNotification(notification: any, handler: any): any;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendNotification(method: any, params: any): Promise<any>;
    /**
     * Creates a new internal notification that can be emitted to clients.
     *
     * @param {string|array<string>} name - notification name
     *
     * @return {Undefined}
     */
    registerInternalNotification(name: any): void;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterInternalNotification(names: any): void;
    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications(): any;
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
    onInternalNotification(notification: any, handler: any): any;
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
    onceInternalNotification(notification: any, handler: any): any;
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
    offInternalNotification(notification: any, handler: any): any;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendInternalNotification(method: any, params: any): Promise<any>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteMethods(): Promise<any>;
    /**
     * Registers an RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     *
     * @returns {void}
     */
    registerMethod(name: any, fn: any): void;
    /**
     * Unregister an RPC method
     *
     * @param {string} name - method name
     *
     * @returns {void}
     */
    unregisterMethod(name: any): void;
    /**
     * Returns list of registered methods names
     *
     * @returns {Array<string>}
     */
    getRegisteredMethodsNames(): any;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callMethod(method: any, params: any, waitTime: any, wsOptions: any): Promise<any>;
    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    registerInternalMethod(name: any, fn: any): any;
    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    unregisterInternalMethod(name: any, fn: any): any;
    /**
     * Returns list of registered internal methods
     *
     * @returns {Array<string>}
     */
    getRegisteredInternalMethodsNames(): any;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callInternalMethod(method: any, params: any, waitTime: any, wsOptions: any): Promise<any>;
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
    call(method: any, params: any, timeout: any, ws_opts: any): Promise<any>;
    /**
     * Fetches a list of client's methods registered on server.
     * @method
     * @return {Array}
     * @deprecated
     */
    listMethods(): Promise<any>;
    /**
     * Sends a JSON-RPC 2.0 notification to server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object} params - optional method parameters
     * @return {Promise}
     * @deprecated
     */
    notify(method: any, params: any): Promise<any>;
}
