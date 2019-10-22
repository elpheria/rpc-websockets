import JsonRPCSocket, {RPC_ERRORS} from "./JsonRpcSocket"
import EventEmitter from "eventemitter3"
import {getType} from "./helpers"

/**
 * Function that validates namespace name
 * @param {string} name - name to validate
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export function assertNamespaceName(name)
{
    if (
        name === null ||
        name === undefined ||
        (typeof name === "string" && name.trim().length === 0)
    )
    {
        throw new TypeError("No namespace name is passed")
    }
    if (typeof name !== "string")
        throw new TypeError(`Name of namespace should be a string, ${getType(name)} passed`)
}

/**
 * Function that validates notification name
 * @param {string} name - name to validate
 * @param {boolean} isInternal - is notification internal or not
 * @throws TypeError if name is not valid
 * @returns {void}
 */
export function assertNotificationName(name, isInternal = false)
{
    if (typeof name !== "string")
        throw new TypeError(
            `Notification name should be a string, ${getType(name)} passed`
        )

    if (name.trim().length === 0)
    {
        throw new Error("Given notification name is empty")
    }

    if (!isInternal && name.startsWith("rpc."))
        throw new Error(
            "Notifications with prefix \"rpc.\" is for internal usage only" +
            "use methods \"registerInternalNotification\" and" +
            "\"unregisterInternalNotification\" to register such notification names"
        )
}

/**
 * Namespace class
 * @class
 */
export default class Namespace extends EventEmitter
{
    constructor(name, options)
    {
        super()

        assertNamespaceName(name)

        this.name = name
        this.options = Object.assign({
            // Whether to send notifications to all connected sockets (false) or to only
            // subscribed sockets (true)
            strict_notifications: true
        }, options)

        this._clients = new Set()
        this._requestsHandlers = new Map()
        this._notificationToSubscribers = new Map()

        // Register internal methods:
        // TODO: was "__listMethods", renamed to "rpc.listMethods"
        this.registerInternalMethod("listMethods", () => this.getRegisteredMethodsNames())
        this.registerInternalMethod("listEvents", () => this.getRegisteredNotifications())
        this.registerInternalMethod("on", (notifications, socket) =>
            this._updateRemoteSubscribers(true, notifications, socket)
        )
        this.registerInternalMethod("off", (notifications, socket) =>
            this._updateRemoteSubscribers(false, notifications, socket)
        )
    }

    destruct()
    {
        this._requestsHandlers.clear()
        delete this._requestsHandlers
        this._notificationToSubscribers.clear()
        delete this._notificationToSubscribers
        this._clients.clear()
        delete this._clients
    }

    close()
    {
        for (const socket of this.getClients())
            socket.close()
        this.destruct()
    }

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
    async _handleRequest(request, response, socket)
    {
        if (!this._requestsHandlers.has(request.method))
        {
            response.throw(RPC_ERRORS.METHOD_NOT_FOUND)
            return
        }

        const requestHandler = this._requestsHandlers.get(request.method)
        let result
        try
        {
            result = await requestHandler(request.params, socket)
        }
        catch (e)
        {
            // If error signature was thrown ({error, message, data})
            if (!(e instanceof Error))
                if (typeof e.code === "undefined")
                    response.throw(RPC_ERRORS.INTERNAL_SERVER_ERROR)
                else
                    response.throw(
                        {
                            code: e.code,
                            message: e.message || RPC_ERRORS.INTERNAL_SERVER_ERROR.message
                        },
                        e.data
                    )
            else
                response.throw(RPC_ERRORS.INTERNAL_SERVER_ERROR, e.message)

            return
        }

        response.send(result)
    }

    /* ----------------------------------------
     | Client-related methods
     |----------------------------------------
     |
     |*/

    addClient(socket)
    {
        if (!this.hasClient(socket))
        {
            if (!(socket instanceof JsonRPCSocket))
                throw new Error("Socket should be an instance of RPCSocket")

            this._clients.add(socket)

            // cleanup after the socket gets disconnected:
            socket.on("close", () => this.removeClient(socket))

            // Handle notifications:
            socket.on("rpc:notification", (notification) =>
            {
                this.emit("rpc:notification", notification, socket)
                this.emit(
                    `rpc:notification:${notification.method}`,
                    notification.params,
                    socket
                )
            })

            // Handle internal notifications:
            socket.on("rpc:internal:notification", (notification) =>
            {
                this.emit("rpc:internal:notification", notification, socket)
                this.emit(
                    `rpc:internal:notification:${notification.method}`,
                    notification.params,
                    socket
                )
            })

            // Handle requests on socket:
            socket.on("rpc:request", this._handleRequest, this)

            // Handle various internal requests on socket:
            socket.on("rpc:internal:request", this._handleRequest, this)
        }
        return this
    }

    removeClient(socket)
    {
        this._clients.delete(socket)
        this._notificationToSubscribers.forEach((subscribers) => subscribers.delete(socket))
    }

    hasClient(socketOrId)
    {
        const socket = typeof socketOrId === "string"
            ? this.getClient(socketOrId)
            : socketOrId
        return this._clients.has(socket)
    }

    getClients()
    {
        return this._clients.values()
    }

    getClient(id)
    {
        let result = null

        for (const client of this._clients)
        {
            if (client.getId() === id)
            {
                result = client
                break
            }
        }

        return result
    }

    /* ----------------------------------------
     | Notifications related methods
     |----------------------------------------
     |
     |*/

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
    _changeNotificationPresence(shouldBeAdded, isInternal, names)
    {
        if (!Array.isArray(names))
            names = [names]

        names.forEach((name) =>
        {
            assertNotificationName(name, isInternal)

            if (isInternal && !name.startsWith("rpc."))
                name = `rpc.${name}`

            if (shouldBeAdded)
            {
                if (!this._notificationToSubscribers.has(name))
                    this._notificationToSubscribers.set(name, new Set())
            }
            else
                this._notificationToSubscribers.delete(name)
        })
    }

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
    _updateRemoteSubscribers(add, notifications, socket)
    {
        if (!Array.isArray(notifications))
            throw new Error("No notifications passed")

        return notifications.reduce((result, notificationName) =>
        {
            if (!this.options.strict_notifications)
            {
                result[notificationName] = "ok"
            }
            else if (this._notificationToSubscribers.has(notificationName))
            {
                const subscribedSockets = this._notificationToSubscribers.get(notificationName)
                if (add)
                    subscribedSockets.add(socket)
                else
                    subscribedSockets.delete(socket)
                result[notificationName] = "ok"
            }
            else
                result[notificationName] = "provided event invalid"

            return result
        }, {})
    }

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
    _changeSubscriptionStatus(action, isInternal, subscriptions, handler)
    {
        if (subscriptions && typeof subscriptions !== "object")
            subscriptions = {[subscriptions]: handler}

        if (!subscriptions || typeof subscriptions !== "object" || Array.isArray(subscriptions))
            throw new Error("Subsciptions is not a mapping of names to handlers")

        const eventPrefix = isInternal ? "rpc:internal:notification" : "rpc:notification"
        Object.entries(subscriptions).forEach(([n, h]) =>
        {
            if (typeof n !== "string" || n.trim().length === 0)
                throw new Error(`Notification name should be non-empty string, ${typeof n} passed`)
            if (typeof h !== "function")
                throw new Error("Notification handler is not defined, or have incorrect type")
            if (!isInternal && n.startsWith("rpc."))
                throw new Error(
                    "Notification with 'rpc.' prefix is for internal use only. " +
                    "To subscribe/unsubsrcibe to such notification use methods " +
                    "\"subscribeInternal\"/\"ubsubscribeInternal\""
                )

            // Add "rpc." prefix for internal requests if omitted:
            if (isInternal && !n.startsWith("rpc."))
                n = `rpc.${n}`

            this[action](`${eventPrefix}:${n}`, h)
        })
    }

    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerNotification(names)
    {
        return this._changeNotificationPresence(true, false, names)
    }

    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterNotification(names)
    {
        return this._changeNotificationPresence(false, false, names)
    }

    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredNotifications()
    {
        return Array.from(this._notificationToSubscribers.keys())
            .filter((name) => !name.startsWith("rpc."))
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
    onNotification(notification, handler)
    {
        this._changeSubscriptionStatus("on", false, notification, handler)
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
    onceNotification(notification, handler)
    {
        this._changeSubscriptionStatus("once", false, notification, handler)
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
    offNotification(notification, handler)
    {
        this._changeSubscriptionStatus("off", false, notification, handler)
    }

    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {object|array} params? - notification parameters
     *
     * @returns {void}
     */
    sendNotification(name, params)
    {
        // Send notification to all connected sockets if namespace is not using
        // "string subscriptions", otherwise send notification only to subscribed sockets:
        const clients = this.options.strict_notifications
            ? this._notificationToSubscribers.get(name)
            : this.getClients()

        if (clients)
        {
            for (const socket of clients)
            {
                socket.sendNotification(name, params)
            }
        }
    }

    /* ----------------------------------------
     | Internal notifications related methods
     |----------------------------------------
     |
     |*/

    /**
     * Register notification with given names as possible to be fired
     *
     * @param {string|array<string>} names - notification names
     *
     * @returns {void}
     */
    registerInternalNotification(names)
    {
        return this._changeNotificationPresence(true, true, names)
    }

    /**
     * Unregister notification with given name as possible to be fired
     *
     * @param {string|array<string>} names - notifications names
     *
     * @returns {void}
     */
    unregisterInternalNotification(names)
    {
        return this._changeNotificationPresence(false, true, names)
    }

    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications()
    {
        return Array.from(this._notificationToSubscribers.keys())
            .filter((name) => name.startsWith("rpc."))
    }

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
    onInternalNotification(notification, handler)
    {
        this._changeSubscriptionStatus("on", false, notification, handler)
    }

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
    onceInternalNotification(notification, handler)
    {
        this._changeSubscriptionStatus("once", false, notification, handler)
    }

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
    offInternalNotification(notification, handler)
    {
        this._changeSubscriptionStatus("off", false, notification, handler)
    }

    /**
     * Send notification to all subscribed sockets
     *
     * @param {string} name - name of notification
     * @param {Array|object} params - notification parameters
     *
     * @returns {void}
     */
    sendInternalNotification(name, params)
    {
        // Send notification to all connected sockets if namespace is not using
        // "string subscriptions", otherwise send notification only to subscribed sockets:
        const clients = this.options.strict_notifications
            ? this._notificationToSubscribers.get(name)
            : this.getClients()

        if (clients)
        {
            for (const socket of clients)
            {
                socket.sendNotification(name, params)
            }
        }
    }

    /*
     |------------------------------------------------------------------------------------------
     | RPC-methods related methods
     |------------------------------------------------------------------------------------------
     |
     |*/

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
    _registerMethods(isInternal, methods, methodHandler)
    {
        if (methods && typeof methods !== "object")
        {
            methods = {[methods]: methodHandler}
        }

        if (!methods || typeof methods !== "object" || Array.isArray(methods))
            throw new Error("Methods list is not a mapping of names to handlers")

        Object.entries(methods).forEach(([name, handler]) =>
        {
            if (!isInternal && name.startsWith("rpc."))
                throw new Error("\".rpc\" prefix should be used only for internal methods")
            if (isInternal && !name.startsWith("rpc."))
                name = `rpc.${name}`

            if (typeof methodHandler !== "function")
                throw new Error("Method handler is not a function")

            this._requestsHandlers.set(name, handler)
        })
    }

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
    _unregisterMethods(isInternal, methods)
    {
        if (methods && !Array.isArray(methods))
            methods = [methods]

        methods.forEach((method) =>
        {
            if (!isInternal && method.startsWith("rpc."))
                throw new Error("\".rpc\" prefix should be used only for internal methods")
            if (isInternal && !method.startsWith("rpc."))
                method = `rpc.${method}`

            this._requestsHandlers.delete(method)
        })
    }

    /**
     * Register a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     * @param {function} methodHandler? - handler function (required only if method name is passed)
     *
     * @returns {void}
     */
    registerMethod(methods, methodHandler)
    {
        this._registerMethods(false, methods, methodHandler)
    }

    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     *
     * @returns {void}
     */
    unregisterMethod(methods)
    {
        this._unregisterMethods(false, methods)
    }

    /**
     * Returns list of registered methods
     *
     * @returns {Array<string>}
     */
    getRegisteredMethodsNames()
    {
        return Array.from(this._requestsHandlers.keys())
            .filter((eventName) => !eventName.startsWith("rpc."))
    }

    /**
     * Register a handler for method with given name or given hash of methods
     *
     * @param {object|string} methods - method name or map of method => handler
     * @param {function} methodHandler? - handler function (required only if method name is passed)
     *
     * @returns {void}
     */
    registerInternalMethod(methods, methodHandler)
    {
        this._registerMethods(true, methods, methodHandler)
    }

    /**
     * Unregister a handler for method with given name or given hash of methods
     *
     * @param {string|array<string>} methods - method name or list of methods to delete
     *
     * @returns {void}
     */
    unregisterInternalMethod(methods)
    {
        this._unregisterMethods(true, methods)
    }

    /**
     * Returns list of registered internal methods
     *
     * @returns {Array<string>}
     */
    getRegisteredInternalMethodsNames()
    {
        return Array.from(this._requestsHandlers.keys())
            .filter((eventName) => eventName.startsWith("rpc."))
            .map((eventName) => eventName.slice(3))
    }

    /* ----------------------------------------
     | Deprecated methods
     |----------------------------------------
     |
     |*/

    /**
     * Registers given notification
     * @param {string} ev_name - name of notification
     * @returns {void}
     * @deprecated
     */
    event(ev_name)
    {
        if (arguments.length !== 1)
            throw new Error("must provide exactly one argument")

        if (typeof ev_name !== "string")
            throw new Error("name must be a string")

        if (ev_name.startsWith("rpc."))
            this.registerInternalNotification(ev_name)
        else
            this.registerNotification(ev_name)
    }

    /**
     * Register a handler for given RPC method
     * @param {string} fn_name - method name
     * @param {function} fn - method handler
     * @returns {void}
     * @deprecated
     */
    register(fn_name, fn)
    {
        if (arguments.length !== 2)
            throw new Error("must provide exactly two arguments")

        if (fn_name.startsWith("rpc."))
            this.registerInternalMethod(fn_name, fn)
        else
            this.registerMethod(fn_name, fn)
    }

    /**
     * Returns registered notifications
     * @returns {Array}
     * @deprecated
     */
    get eventList()
    {
        return this.getRegisteredNotifications()
            .concat(this.getRegisteredInternalNotifications())
    }

    /**
     * Returns a hash of websocket objects connected to this namespace.
     * @inner
     * @method
     * @return {Object}
     * @deprecated
     */
    connected()
    {
        const clients = {}

        for (const client of this._clients)
            clients[client.getId()] = client

        return clients
    }

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
    clients()
    {
        return Array.from(this.getClients())
    }
}
