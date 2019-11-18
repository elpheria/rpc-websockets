import { IJsonRpcSocket, TJsonRpcSocketId, TRpcNotificationName, TRpcNotificationHandler, TRpcNotificationParams, IRpcRequest, TRpcRequestName, TRpcRequestHandler, IRpcResponder } from "../JsonRpcSocket/types";
import EventEmitter from "eventemitter3";
import { INamespace, TNamespaceName, INamespaceOptions, INotificationsSubscriptionsResult } from "./types";
/**
 * Function that validates namespace name
 * @param {string} name - name to validate
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export declare function assertNamespaceName(name?: any): void;
/**
 * Function that validates notification name
 * @param {string} name - name to validate
 * @param {boolean} isInternal - is notification internal or not
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export declare function assertNotificationName(name: any, isInternal?: boolean): void;
/**
 * Namespace class
 * @class
 */
export default class Namespace extends EventEmitter implements INamespace {
    private _name;
    private options;
    private _clients;
    private _requestsHandlers;
    private _notificationToSubscribers;
    constructor(name: TNamespaceName, options: INamespaceOptions);
    destruct(): void;
    close(): void;
    /**
     * Returns name of namespace
     * @returns {*}
     */
    getName(): string;
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
    _handleRequest(request: IRpcRequest, response: IRpcResponder, socket: IJsonRpcSocket): Promise<void>;
    addClient(socket: IJsonRpcSocket): INamespace;
    removeClient(socket: IJsonRpcSocket): void;
    hasClient(socketOrId: IJsonRpcSocket | TJsonRpcSocketId): boolean;
    getClients(): IterableIterator<IJsonRpcSocket>;
    getClient(id: TJsonRpcSocketId): IJsonRpcSocket;
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
    _changeNotificationPresence(shouldBeAdded: boolean, isInternal: boolean, names: TRpcNotificationName | Array<TRpcNotificationName>): void;
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
    _updateRemoteSubscribers(add: boolean, notifications: Array<TRpcNotificationName>, socket: IJsonRpcSocket): INotificationsSubscriptionsResult;
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
    _changeSubscriptionStatus(action: "on" | "off" | "once", isInternal: boolean, subscriptions: TRpcNotificationName | {
        [key: string]: TRpcNotificationHandler;
    }, handler?: TRpcNotificationHandler): void;
    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void;
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
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {object|array} params? - notification parameters
     *
     * @returns {void}
     */
    sendNotification(name: TRpcNotificationName, params?: TRpcNotificationParams): Promise<void[]>;
    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerInternalNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void;
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
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {Array|object} params - notification parameters
     *
     * @returns {void}
     */
    sendInternalNotification(name: TRpcNotificationName, params?: TRpcNotificationParams): Promise<void[]>;
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
    _registerMethods(isInternal: boolean, methods: TRpcRequestName | {
        [key: string]: TRpcRequestHandler;
    }, methodHandler?: TRpcRequestHandler): void;
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
    _unregisterMethods(isInternal: boolean, methods: TRpcRequestName | Array<TRpcRequestName>): void;
    /**
     * Register a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     * @param {function} methodHandler? - handler function (required only if method name is passed)
     *
     * @returns {void}
     */
    registerMethod(methods: TRpcRequestName | {
        [key: string]: TRpcRequestHandler;
    }, methodHandler?: TRpcRequestHandler): void;
    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {Array<string>|string} methods - method name or map of method => handler
     *
     * @returns {void}
     */
    unregisterMethod(methods: TRpcRequestName | Array<TRpcRequestName>): void;
    /**
     * Returns list of registered methods
     *
     * @returns {Array<string>}
     */
    getRegisteredMethodsNames(): string[];
    /**
     * Register a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     * @param {function} methodHandler? - handler function (required only if method name is passed)
     *
     * @returns {void}
     */
    registerInternalMethod(methods: TRpcRequestName | {
        [key: string]: TRpcRequestHandler;
    }, methodHandler?: TRpcRequestHandler): void;
    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {string|array<string>} methods - method name or list of methods to delete
     *
     * @returns {void}
     */
    unregisterInternalMethod(methods: TRpcRequestName | Array<TRpcRequestName>): void;
    /**
     * Returns list of registered internal methods
     *
     * @returns {Array<string>}
     */
    getRegisteredInternalMethodsNames(): string[];
    /**
     * Registers given notification
     * @param {string} ev_name - name of notification
     * @returns {void}
     * @deprecated
     */
    event(ev_name: TRpcNotificationName): void;
    /**
     * Register a handler for given RPC method
     * @param {string} fn_name - method name
     * @param {function} fn - method handler
     * @returns {void}
     * @deprecated
     */
    register(fn_name: TRpcRequestName, fn: TRpcRequestHandler): void;
    /**
     * Returns registered notifications
     * @returns {Array}
     * @deprecated
     */
    get eventList(): string[];
    /**
     * Returns a hash of websocket objects connected to this namespace.
     * @inner
     * @method
     * @return {Object}
     * @deprecated
     */
    connected(): {
        [key: string]: IJsonRpcSocket;
    };
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
    clients(): IJsonRpcSocket[];
}
