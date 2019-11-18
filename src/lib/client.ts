/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */

"use strict"

import NodeWebSocket from "ws"
// @ts-ignore
import assertArgs from "assert-args"
import EventEmitter from "eventemitter3"
import Namespace from "./Namespace"
import JsonRPCSocket, {TimeoutError, RPCServerError} from "./JsonRpcSocket"

export default class CommonClient extends EventEmitter
{
    static RPCResponseTimeoutError = TimeoutError
    static RPCServerError = RPCServerError

    /**
     * Instantiate a Client class.
     * @constructor
     * @param {webSocketFactory} webSocketFactory - factory method for WebSocket
     * @param {String} address - url to a websocket server
     * @param {Object} options - ws options object with reconnect parameters
     * @param {Function} generate_request_id - custom generation request Id
     * @return {CommonClient}
     */
    constructor(address = "ws://localhost:8080", {
        autoconnect = true,
        reconnect = true,
        reconnect_interval = 1000,
        max_reconnects = 5,
        strict_subscriptions = true
    } = {},
    generate_request_id
    )
    {
        super()

        this.wsOptions = arguments[1]
        this.options = {
            address,
            max_reconnects,
            reconnect,
            autoconnect,
            reconnect_interval,
            strict_subscriptions,
            generate_request_id
        }

        this._ready = false
        this._currentReconnects = 0
        this._socket = null
        this._rpcSocket = null
        this._namespace = new Namespace("/", {
            strict_subscriptions,
            // Client namespace should never use strict notifications, so client's events will
            // always be delivered to server:
            strict_notifications: false
        })

        if (this.options.autoconnect)
            this.connect()
    }

    /**
     * Connection/Message handler.
     * @method
     * @private
     * @param {String} address - WebSocket API address
     * @param {Object} options - ws options object
     * @return {Undefined}
     */
    _connect(address, options)
    {
        const socket = new WebSocket(address, options)
        const rpcSocket = new JsonRPCSocket(socket, "main", {
            generate_request_id: this.options.generate_request_id || null
        })

        rpcSocket.on("open", () =>
        {
            this._ready = true
            this.emit("open")
            this._currentReconnects = 0
        })

        rpcSocket.on("error", (error) => this.emit("error", error))

        rpcSocket.on("close", (code, message) =>
        {
            if (this._ready)
                this.emit("close", code, message)

            this._ready = false

            if (code === 1000)
                return

            this._currentReconnects++

            if (
                this.options.reconnect &&
                (
                    (this.options.max_reconnects > this._currentReconnects) ||
                    this.options.max_reconnects === 0
                )
            )
                setTimeout(() => this._connect(address, options), this.options.reconnect_interval)
        })

        this._socket = socket
        this._rpcSocket = rpcSocket

        // Add socket to namespace:
        this._namespace.addClient(rpcSocket)
    }

    /**
     * Connects to a defined server if not connected already.
     * @method
     * @return {Undefined}
     */
    async connect()
    {
        return new Promise((resolve, reject) =>
        {
            // Run new connection:
            if (!this._rpcSocket)
                this._connect(this.options.address, this.wsOptions)

            // If websocket is not in "OPENED" state then it's ready:
            if (this._rpcSocket.getSocket().readyState === 1)
                return resolve()
            // Otherwise wait till connection opened:
            else
            {
                this.once("open", resolve)
                this.once("error", reject)
            }
        })
    }

    /**
     * Closes a WebSocket connection gracefully.
     * @method
     * @param {Number} code - socket close code
     * @param {String} data - optional data to be sent before closing
     * @return {Undefined}
     */
    close(code, data)
    {
        if (this._rpcSocket)
        {
            const socket = this._rpcSocket.getSocket()
            // If socket is connecting now - wait till connection establish and close it:
            // (To prevent error "WebSocket was closed before the connection was established"):
            if (socket.readyState === 0)
            {
                this.once("open", () => this.close(code, data))
            }
            // If socket is connected - close it. Otherwise do nothing:
            else if (socket.readyState === 1)
            {
                this._rpcSocket.close(code, data)
            }
        }
    }

    /* ----------------------------------------
     | RPC Notifications related methods
     |----------------------------------------
     |
     |*/
    async _updateSubscription(subscribe, events)
    {
        if (typeof events === "string")
            events = [ events ]

        if (!Array.isArray(events))
            return Promise.reject(new TypeError("Passed events list is not an array"))

        // Successfully update subscription state if "strict subscriptions" mode is not used:
        if (!this.options.strict_subscriptions)
        {
            return events.reduce((result, event) =>
            {
                result[event] = "ok"
                return result
            }, {})
        }
        // Otherwise ask server for subscription state change:
        else
        {
            const method = subscribe ? "on" : "off"
            return await this.callInternalMethod(method, events)
        }
    }

    /**
     * Subscribes for a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async subscribe(event: string | Array<string>)
    {
        return this._updateSubscription(true, event)
    }

    /**
     * Unsubscribes from a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async unsubscribe(event: string | Array<string>)
    {
        return this._updateSubscription(false, event)
    }

    /**
     * Retrieve list of remote events
     *
     * @returns {Promise<array<string>>}
     */
    async listRemoteEvents()
    {
        return this._rpcSocket.listRemoteEvents()
    }

    /**
     * Creates a new notification that can be emitted to clients.
     *
     * @param {String|array<string>} name - notification name
     *
     * @throws {TypeError}
     *
     * @return {Undefined}
     */
    registerNotification(name)
    {
        return this._namespace.registerNotification(name)
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
        return this._namespace.unregisterNotification(names)
    }

    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredNotifications()
    {
        return this._namespace.getRegisteredNotifications()
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
        return this._namespace.onNotification(notification, handler)
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
        return this._namespace.onceNotification(notification, handler)
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
        return this._namespace.offNotification(notification, handler)
    }

    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    async sendNotification(method, params)
    {
        return this._namespace.sendNotification(method, params)
    }

    /* ----------------------------------------
     | RPC Internal Notifications related methods
     |----------------------------------------
     |
     |*/

    /**
     * Creates a new internal notification that can be emitted to clients.
     *
     * @param {string|array<string>} name - notification name
     *
     * @return {Undefined}
     */
    registerInternalNotification(name)
    {
        this._namespace.registerInternalNotification(name)
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
        this._namespace.unregisterInternalNotification(names)
    }

    /**
     * Returns list of registered notification names
     *
     * @returns {Array}
     */
    getRegisteredInternalNotifications()
    {
        return this._namespace.getRegisteredInternalNotifications()
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
        return this._namespace.onInternalNotification(notification, handler)
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
        return this._namespace.onceInternalNotification(notification, handler)
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
        return this._namespace.offInternalNotification(notification, handler)
    }

    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    async sendInternalNotification(method, params)
    {
        return this._namespace.sendInternalNotification(method, params)
    }

    /* ----------------------------------------
     | RPC Methods related methods
     |----------------------------------------
     |
     |*/
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    async listRemoteMethods()
    {
        return this._rpcSocket.listRemoteMethods()
    }

    /**
     * Registers an RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     *
     * @returns {void}
     */
    registerMethod(name, fn)
    {
        this._namespace.registerMethod(name, fn)
    }

    /**
     * Unregister an RPC method
     *
     * @param {string} name - method name
     *
     * @returns {void}
     */
    unregisterMethod(name)
    {
        this._namespace.unregisterMethod(name)
    }

    /**
     * Returns list of registered methods names
     *
     * @returns {Array<string>}
     */
    getRegisteredMethodsNames()
    {
        return this._namespace.getRegisteredMethodsNames()
    }

    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    async callMethod(method, params, waitTime, wsOptions)
    {
        return this._rpcSocket.callMethod(method, params, waitTime, wsOptions)
    }

    /* ----------------------------------------
     | RPC Internal Methods related methods
     |----------------------------------------
     |
     |*/

    /**
     * Registers an internal RPC method
     *
     * @param {string} name - method name
     * @param {function} fn - method handler
     * @param {string} ns? - namespace name to register
     *
     * @returns {void}
     */
    registerInternalMethod(name, fn)
    {
        return this._namespace.registerInternalMethod(name, fn)
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
    unregisterInternalMethod(name, fn)
    {
        return this._namespace.unregisterInternalMethod(name, fn)
    }

    /**
     * Returns list of registered internal methods
     *
     * @returns {Array<string>}
     */
    getRegisteredInternalMethodsNames()
    {
        return this._namespace.getRegisteredInternalMethodsNames()
    }

    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    async callInternalMethod(method, params, waitTime, wsOptions)
    {
        return this._rpcSocket.callInternalMethod(method, params, waitTime, wsOptions)
    }

    /* ----------------------------------------
     | Deprecated methods
     |----------------------------------------
     |
     |*/
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
    call(method, params, timeout, ws_opts)
    {
        assertArgs(arguments, {
            "method": "string",
            "[params]": ["object", Array],
            "[timeout]": "number",
            "[ws_opts]": "object"
        })

        if (method.startsWith("rpc."))
            return this.callInternalMethod(method, params, timeout, ws_opts)
        else
            return this.callMethod(method, params, timeout, ws_opts)
    }

    /**
     * Fetches a list of client's methods registered on server.
     * @method
     * @return {Array}
     * @deprecated
     */
    async listMethods()
    {
        return this.listRemoteMethods()
    }

    /**
     * Sends a JSON-RPC 2.0 notification to server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object} params - optional method parameters
     * @return {Promise}
     * @deprecated
     */
    async notify(method, params)
    {
        if (typeof method !== "string")
            return Promise.reject(
                new TypeError("Notification name should be a string")
            )

        if (method.startsWith("rpc."))
            return this._rpcSocket.sendInternalNotification(method, params)
        else
            return this._rpcSocket.sendNotification(method, params)
    }
}
