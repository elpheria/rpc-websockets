/**
 * Function that validates namespace name
 * @param {string} name - name to validate
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export function assertNamespaceName(name: string): void;
/**
 * Function that validates notification name
 * @param {string} name - name to validate
 * @param {boolean} isInternal - is notification internal or not
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export function assertNotificationName(name: string, isInternal?: boolean): void;
/**
 * Namespace class
 * @class
 */
export default class Namespace extends EventEmitter<string | symbol> {
    constructor(name: any, options: any);
    _name: any;
    options: any;
    _clients: Set<any>;
    _requestsHandlers: Map<any, any>;
    _notificationToSubscribers: Map<any, any>;
    destruct(): void;
    close(): void;
    /**
     * Returns name of namespace
     * @returns {*}
     */
    getName(): any;
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
    _handleRequest(request: any, response: any, socket: any): Promise<any>;
    addClient(socket: any): Namespace;
    removeClient(socket: any): void;
    hasClient(socketOrId: any): boolean;
    getClients(): IterableIterator<any>;
    getClient(id: any): any;
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
    _changeNotificationPresence(shouldBeAdded: boolean, isInternal: boolean, names: any): void;
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
    _updateRemoteSubscribers(add: boolean, notifications: string[], socket: any): any;
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
    _changeSubscriptionStatus(action: string, isInternal: boolean, subscriptions: any, handler: Function): void;
    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerNotification(names: any): void;
    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterNotification(names: any): void;
    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredNotifications(): any[];
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
    onNotification(notification: any, handler: Function): void;
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
    onceNotification(notification: any, handler: Function): void;
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
    offNotification(notification: any, handler: Function): void;
    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {object|array} params? - notification parameters
     *
     * @returns {void}
     */
    sendNotification(name: string, params: any): void;
    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerInternalNotification(names: any): void;
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
    getRegisteredInternalNotifications(): any[];
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
    onInternalNotification(notification: any, handler: Function): void;
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
    onceInternalNotification(notification: any, handler: Function): void;
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
    offInternalNotification(notification: any, handler: Function): void;
    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {Array|object} params - notification parameters
     *
     * @returns {void}
     */
    sendInternalNotification(name: string, params: any): void;
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
    _registerMethods(isInternal: boolean, methods: any, methodHandler: Function): void;
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
    _unregisterMethods(isInternal: boolean, methods: string | string[]): void;
    /**
     * Register a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     * @param {function} methodHandler? - handler function (required only if method name is passed)
     *
     * @returns {void}
     */
    registerMethod(methods: any, methodHandler: Function): void;
    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     *
     * @returns {void}
     */
    unregisterMethod(methods: any): void;
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
    registerInternalMethod(methods: any, methodHandler: Function): void;
    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {string|array<string>} methods - method name or list of methods to delete
     *
     * @returns {void}
     */
    unregisterInternalMethod(methods: any): void;
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
    event(ev_name: string, ...args: any[]): void;
    /**
     * Register a handler for given RPC method
     * @param {string} fn_name - method name
     * @param {function} fn - method handler
     * @returns {void}
     * @deprecated
     */
    register(fn_name: string, fn: Function, ...args: any[]): void;
    /**
     * Returns registered notifications
     * @returns {Array}
     * @deprecated
     */
    get eventList(): any[];
    /**
     * Returns a hash of websocket objects connected to this namespace.
     * @inner
     * @method
     * @return {Object}
     * @deprecated
     */
    connected(): Object;
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
    clients(): any[];
    on(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): Namespace;
    addListener(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): Namespace;
    once(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): Namespace;
    removeListener(event: string | symbol, fn?: EventEmitter.ListenerFn, context?: any, once?: boolean): Namespace;
    off(event: string | symbol, fn?: EventEmitter.ListenerFn, context?: any, once?: boolean): Namespace;
    removeAllListeners(event?: string | symbol): Namespace;
}
import EventEmitter from "eventemitter3";
