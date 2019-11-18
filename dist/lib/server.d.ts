/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */
import EventEmitter from "eventemitter3";
import { Server as WebSocketServer } from "ws";
import { RPCServerError, TimeoutError } from "./JsonRpcSocket";
import Namespace from "./Namespace";
export default class Server extends EventEmitter {
    static RPCResponseTimeoutError: typeof TimeoutError;
    static RPCServerError: typeof RPCServerError;
    constructor(options?: {});
    /**
     * Start websocket server
     *
     * @param {object} options - websocket server options
     *
     * @returns {WebSocketServer}
     *
     * @private
     */
    _startServer(options: any): WebSocketServer;
    /**
     * Closes the server and terminates all clients.
     * @method
     * @return {Promise}
     */
    close(): Promise<unknown>;
    /**
     * Returns socket with given ID
     * @method
     * @param {string} id - socket id
     * @returns {JsonRPCSocket|null}
     */
    getRPCSocket(id: any): any;
    /**
     * Creates namespace under given name
     * @method
     * @param {string} name - uuid of namespace
     * @returns {Namespace}
     */
    createNamespace(name: any): Namespace;
    /**
     * Check is namespace exists
     * @method
     * @param {String} name - namespace name
     * @returns {Boolean}
     */
    hasNamespace(name: any): any;
    /**
     * Returns namespace with given name
     * @method
     * @param {string} name - uuid of namespace
     * @returns {Namespace|null}
     */
    getNamespace(name: any): any;
    /**
     * Returns existing namespace or creates new and returns it
     * @method
     * @param {string} name - uuid of namespace
     * @returns {Namespace}
     */
    getOrCreateNamespace(name: any): any;
    /**
     * Removes a namespace and closes all connections that belongs to it
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    closeNamespace(name: any): void;
    /**
     * Returns a requested namespace object
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Object} - namespace object
     */
    of(name: string): any;
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
    _changeSubscriptionStatus(action: any, isInternal: any, subscriptions: any, handler: any): void;
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
    registerNotification(names: any, ns?: string): any;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {array|array<string>} names - notifications names
     * @param {String} ns? - namespace identifier
     *
     * @returns {void}
     */
    unregisterNotification(names: any, ns?: string): void;
    /**
     * Returns list of registered notification names
     *
     * @param {String} ns? - namespace identifier
     *
     * @returns {Array}
     */
    getRegisteredNotifications(ns?: string): any;
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
    onNotification(notification: any, handler: any): void;
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
    onceNotification(notification: any, handler: any): void;
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
    offNotification(notification: any, handler: any): void;
    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {object|array} params? - notification parameters
     *
     * @returns {void}
     */
    sendNotification(name: any, params: any): Promise<any[]>;
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
    registerInternalNotification(names: any, ns?: string): any;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {array|array<string>} names - notifications names
     * @param {String} ns? - namespace identifier
     *
     * @returns {void}
     */
    unregisterInternalNotification(names: any, ns?: string): void;
    /**
     * Returns list of registered internal notification names
     *
     * @param {String} ns? - namespace identifier
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications(ns?: string): any;
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
    onInternalNotification(notification: any, handler: any): void;
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
    onceInternalNotification(notification: any, handler: any): void;
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
    offInternalNotification(notification: any, handler: any): void;
    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {object|array} params? - notification parameters
     *
     * @returns {void}
     */
    sendInternalNotification(name: any, params: any): Promise<any[]>;
    /**
     * Registers an RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    registerMethod(name: any, fn: any, ns?: string): void;
    /**
     * Unregister an RPC method
     *
     * @param {string} name - method name
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    unregisterMethod(name: any, ns?: string): void;
    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    registerInternalMethod(name: any, fn: any, ns?: string): void;
    /**
     * Unregister an RPC method
     *
     * @param {string} name - method name
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    unregisterInternalMethod(name: any, ns?: string): void;
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
    register(name: any, fn: any, ns?: string): void;
    /**
     * Creates a new event that can be emitted to clients.
     * @method
     * @param {String} name - event name
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     * @deprecated
     */
    event(name: any, ns?: string): void;
    /**
     * Lists all created events in a given namespace. Defaults to "/".
     * @method
     * @param {String} ns - namespaces identifier
     * @readonly
     * @return {Array} - returns a list of created events
     * @deprecated
     */
    eventList(ns?: string): any;
    /**
     * Creates a JSON-RPC 2.0 compliant error
     * @method
     * @param {Number} code - indicates the error type that occurred
     * @param {String} message - provides a short description of the error
     * @param {String|Object} data - details containing additional information about the error
     * @return {Object}
     * @deprecated
     */
    createError(code: any, message: any, data: any): {
        code: any;
        message: any;
        data: any;
    };
}
