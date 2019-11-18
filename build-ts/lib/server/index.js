/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */
"use strict";
import { Server as WebSocketServer } from "ws";
import EventEmitter from "eventemitter3";
import uuid from "uuid";
import url from "url";
// @ts-ignore
import assertArgs from "assert-args";
import JsonRPCSocket, { RPCServerError, TimeoutError } from "../JsonRpcSocket";
import Namespace, { assertNamespaceName, assertNotificationName } from "../Namespace";
import { getType } from "../helpers";
export default class Server extends EventEmitter {
    constructor(options = {}) {
        super();
        if (options.strict_notifications !== undefined &&
            typeof options.strict_notifications !== "boolean") {
            const argType = getType(options.strict_notifications);
            throw new TypeError(`"strict_notifications" should be boolean, "${argType}" given`);
        }
        if (options.idParam !== undefined &&
            typeof options.idParam !== "string") {
            throw new TypeError(`"idParam" should be a string, "${getType(options.idParam)}" given`);
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
        this.options = Object.assign({
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
        this._namespaces = new Map();
        /**
         * Stores all connected sockets as uuid => socket
         *
         * @type {Map<string|number, WebSocket>}
         *
         * @private
         */
        this._sockets = new Map();
        /**
         * Websocket server
         *
         * @type {WebSocketServer}
         */
        this.wss = this._startServer(this.options);
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
    _startServer(options) {
        const server = new WebSocketServer(options);
        server.on("listening", () => this.emit("listening"));
        server.on("connection", (socket, request) => {
            this.emit("connection", socket, request);
            const u = url.parse(request.url, true);
            const ns = u.pathname;
            const id = u.query[this.options.idParam] || uuid.v1();
            // Create RPC wrapper for socket:
            const wrappedSocket = new JsonRPCSocket(socket, id);
            // Register socket and set it to some namespace:
            this._sockets.set(id, wrappedSocket);
            this.getOrCreateNamespace(ns).addClient(wrappedSocket);
            // Emit an event about RPC connection:
            this.emit("RPCConnection", wrappedSocket, request);
            // Clear socket data on delete:
            socket.on("close", () => this._sockets.delete(id));
        });
        server.on("error", (error) => this.emit("error", error));
        return server;
    }
    /**
     * Closes the server and terminates all clients.
     * @method
     * @return {Promise}
     */
    close() {
        return new Promise((resolve, reject) => {
            try {
                this.wss.close(resolve);
            }
            catch (error) {
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
    getRPCSocket(id) {
        if (id === null || id === undefined || id === "") {
            throw new TypeError("No socket ID passed");
        }
        if (typeof id !== "string") {
            throw new TypeError(`Expected Socket ID as number, ${getType(id)} passed`);
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
    createNamespace(name) {
        if (this.hasNamespace(name)) {
            throw new Error(`Failed to create namespace: Namespace with name ${name} already exists`);
        }
        const ns = new Namespace(name, {
            strict_notifications: this.options.strict_notifications
        });
        this._namespaces.set(name, ns);
        // Handle notifications:
        ns.on("rpc:notification", (notification, socket) => {
            this.emit("rpc:notification", notification, socket, ns);
            this.emit(`rpc:notification:${notification.method}`, notification.params, socket, ns);
        });
        // Handle internal notifications:
        ns.on("rpc:internal:notification", (notification, socket) => {
            this.emit("rpc:internal:notification", notification, socket, ns);
            this.emit(`rpc:internal:notification:${notification.method}`, notification.params, socket, ns);
        });
        return ns;
    }
    /**
     * Check is namespace exists
     * @method
     * @param {String} name - namespace name
     * @returns {Boolean}
     */
    hasNamespace(name) {
        assertNamespaceName(name);
        return this._namespaces.has(name);
    }
    /**
     * Returns namespace with given name
     * @method
     * @param {string} name - uuid of namespace
     * @returns {Namespace|null}
     */
    getNamespace(name) {
        assertNamespaceName(name);
        return this._namespaces.get(name) || null;
    }
    /**
     * Returns existing namespace or creates new and returns it
     * @method
     * @param {string} name - uuid of namespace
     * @returns {Namespace}
     */
    getOrCreateNamespace(name) {
        return this.hasNamespace(name) ? this.getNamespace(name) : this.createNamespace(name);
    }
    /**
     * Removes a namespace and closes all connections that belongs to it
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    closeNamespace(name) {
        if (this.hasNamespace(name)) {
            this.getNamespace(name).close();
            this._namespaces.delete(name);
        }
    }
    /**
     * Returns a requested namespace object
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Object} - namespace object
     */
    of(name) {
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
    _changeSubscriptionStatus(action, isInternal, subscriptions, handler) {
        if (typeof subscriptions === "string")
            subscriptions = { [subscriptions]: handler };
        if (!subscriptions || typeof subscriptions !== "object" || Array.isArray(subscriptions))
            throw new TypeError("Subsciptions is not a mapping of names to handlers");
        const eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification";
        Object.entries(subscriptions).forEach(([n, h]) => {
            assertNotificationName(n, isInternal);
            if (typeof h !== "function")
                throw new TypeError(`Expected function as notification handler, got ${getType(h)}`);
            // Add "rpc." prefix for internal requests if omitted:
            if (isInternal && !n.startsWith("rpc."))
                n = `rpc.${n}`;
            this[action](`${eventPrefix}:${n}`, h);
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
    registerNotification(names, ns = "/") {
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
    unregisterNotification(names, ns = "/") {
        if (!Array.isArray(names)) {
            names = [names];
        }
        names.forEach((name) => assertNotificationName(name));
        if (this.hasNamespace(ns))
            this.getNamespace(ns).unregisterNotification(names);
    }
    /**
     * Returns list of registered notification names
     *
     * @param {String} ns? - namespace identifier
     *
     * @returns {Array}
     */
    getRegisteredNotifications(ns = "/") {
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
    onNotification(notification, handler) {
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
    onceNotification(notification, handler) {
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
    offNotification(notification, handler) {
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
    async sendNotification(name, params) {
        assertNotificationName(name);
        const notificationsSent = [];
        for (const namespace of this._namespaces.values()) {
            const sendProcess = namespace.sendNotification(name, params);
            notificationsSent.push(sendProcess);
        }
        return Promise.all(notificationsSent);
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
    registerInternalNotification(names, ns = "/") {
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
    unregisterInternalNotification(names, ns = "/") {
        if (!Array.isArray(names)) {
            names = [names];
        }
        names.forEach((name) => assertNotificationName(name, true));
        if (this.hasNamespace(ns))
            this.getNamespace(ns).unregisterInternalNotification(names);
    }
    /**
     * Returns list of registered internal notification names
     *
     * @param {String} ns? - namespace identifier
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications(ns = "/") {
        return this.hasNamespace(ns)
            ? this.getNamespace(ns).getRegisteredInternalNotifications()
            : [];
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
    onInternalNotification(notification, handler) {
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
    onceInternalNotification(notification, handler) {
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
    offInternalNotification(notification, handler) {
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
    async sendInternalNotification(name, params) {
        assertNotificationName(name, true);
        const notificationsSent = [];
        for (const namespace of this._namespaces.values()) {
            const sendProcess = namespace.sendInternalNotification(name, params);
            notificationsSent.push(sendProcess);
        }
        return Promise.all(notificationsSent);
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
    registerMethod(name, fn, ns = "/") {
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
    unregisterMethod(name, ns = "/") {
        if (this.hasNamespace(ns))
            this.getNamespace(ns).unregisterMethod(name);
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
    registerInternalMethod(name, fn, ns = "/") {
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
    unregisterInternalMethod(name, ns = "/") {
        if (this.hasNamespace(ns))
            this.getNamespace(ns).unregisterInternalMethod(name);
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
    register(name, fn, ns = "/") {
        assertArgs(arguments, {
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
    event(name, ns = "/") {
        assertArgs(arguments, {
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
    eventList(ns = "/") {
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
    createError(code, message, data) {
        assertArgs(arguments, {
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
}
Server.RPCResponseTimeoutError = TimeoutError;
Server.RPCServerError = RPCServerError;
