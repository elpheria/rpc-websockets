/**
 * "Client" wraps "qaap/uws-bindings" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */

"use strict"

import assertArgs from "assert-args"
import EventEmitter from "eventemitter3"
import CircularJSON from "circular-json"

export default (WebSocket) => class Client extends EventEmitter
{
    /**
     * Instantiate a Client class.
     * @constructor
     * @param {String} address - url to a websocket server
     * @param {Object} options - ws options object with reconnect parameters
     * @param {Function} generate_request_id - custom generation request Id
     * @return {Client}
     */
    constructor(address = "ws://localhost:8080", {
        autoconnect = true,
        reconnect = true,
        reconnect_interval = 1000,
        max_reconnects = 5
    } = {},
    generate_request_id
    )
    {
        super()

        this.queue = {}
        this.rpc_id = 0

        this.autoconnect = autoconnect
        this.ready = false
        this.reconnect = reconnect
        this.reconnect_interval = reconnect_interval
        this.max_reconnects = max_reconnects
        this.current_reconnects = 0
        this.generate_request_id = generate_request_id || (() => ++this.rpc_id)

        if (this.autoconnect)
            this._connect(address, arguments[1])
    }

    /**
     * Calls a registered RPC method on server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object|Array} params - optional method parameters
     * @param {Number} timeout - RPC reply timeout value
     * @param {Object} uws_opts - options passed to uWebSockets
     * @return {Promise}
     */
    call(method, params, timeout, uws_opts)
    {
        assertArgs(arguments, {
            "method": "string",
            "[params]": ["object", Array],
            "[timeout]": "number",
            "[uws_opts]": "object"
        })

        if (!uws_opts && "object" === typeof timeout)
        {
            uws_opts = timeout
            timeout = null
        }

        return new Promise((resolve, reject) =>
        {
            if (!this.ready)
                return reject(new Error("socket not ready"))

            const rpc_id = this.generate_request_id(method, params)

            const message = {
                jsonrpc: "2.0",
                method: method,
                params: params || null,
                id: rpc_id
            }

            this.socket.send(JSON.stringify(message), uws_opts, (error) =>
            {
                if (error)
                    return reject(error)

                this.queue[rpc_id] = { promise: [resolve, reject] }

                if (timeout)
                {
                    this.queue[rpc_id].timeout = setTimeout(() =>
                    {
                        this.queue[rpc_id] = null
                        reject(new Error("reply timeout"))
                    }, timeout)
                }
            })
        })
    }

    /**
     * Sends a JSON-RPC 2.0 notification to server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object} params - optional method parameters
     * @return {Promise}
     */
    notify(method, params)
    {
        assertArgs(arguments, {
            "method": "string",
            "[params]": ["object", Array]
        })

        return new Promise((resolve, reject) =>
        {
            if (!this.ready)
                return reject(new Error("socket not ready"))

            const message = {
                jsonrpc: "2.0",
                method: method,
                params: params || null
            }

            this.socket.send(JSON.stringify(message), (error) =>
            {
                if (error)
                    return reject(error)

                resolve()
            })
        })
    }

    /**
     * Subscribes for a defined event.
     * @method
     * @param {String} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async subscribe(event)
    {
        assertArgs(arguments, {
            event: "string"
        })

        const result = await this.call("rpc.on", [event])

        if (result[event] !== "ok")
            throw new Error("Failed subscribing to an event '" + event + "' with: " + result[event])
    }

    /**
     * Unsubscribes from a defined event.
     * @method
     * @param {String} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async unsubscribe(event)
    {
        assertArgs(arguments, {
            event: "string"
        })

        const result = await this.call("rpc.off", [event])

        if (result[event] !== "ok")
            throw new Error("Failed unsubscribing from an event with: " + result)
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
        this.socket.close(code || 1000, data)
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
        this.socket = new WebSocket(address, options)

        this.socket.on("open", () =>
        {
            this.ready = true
            this.emit("open")
            this.current_reconnects = 0
        })

        this.socket.on("message", (message) =>
        {
            if (message instanceof ArrayBuffer)
                message = Buffer.from(message).toString()

            try { message = CircularJSON.parse(message) }

            catch (error) { return }

            // check if any listeners are attached and forward event
            if (message.notification && this.listeners(message.notification).length)
            {
                if (!Object.keys(message.params).length)
                    return this.emit(message.notification)

                const args = [message.notification]

                if (message.params.constructor === Object)
                    args.push(message.params)
                else
                    // using for-loop instead of unshift/spread because performance is better
                    for (let i = 0; i < message.params.length; i++)
                        args.push(message.params[i])

                return this.emit.apply(this, args)
            }

            if (!this.queue[message.id])
                return

            if (this.queue[message.id].timeout)
                clearTimeout(this.queue[message.id].timeout)

            if (message.error)
                this.queue[message.id].promise[1](message.error)
            else
                this.queue[message.id].promise[0](message.result)

            this.queue[message.id] = null
        })

        this.socket.on("error", (error) => this.emit("error", error))

        this.socket.on("close", (code, message) =>
        {
            if (this.ready)
                this.emit("close", code, message)

            this.ready = false

            if (code === 1000)
                return

            this.current_reconnects++

            if (this.reconnect && (this.max_reconnects > this.current_reconnects) ||
                    this.max_reconnects === 0)
                setTimeout(() => this._connect(address, options), this.reconnect_interval)
        })
    }
}
