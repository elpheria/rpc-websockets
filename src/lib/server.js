/**
 * Server wraps the "websockets/ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */

"use strict"

import assertArgs from "assert-args"
import EventEmitter from "events"
import { Server as WebSocketServer } from "ws"
import uuid from "uuid"
import url from "url"

import * as utils from "./utils"

export default class Server extends EventEmitter
{
    /**
     * Instantiate a Server server.
     * @constructor
     * @param {Object} options - ws constructor's parameters with rpc
     * @return {Server} - returns a new Server instance
     */
    constructor(options)
    {
        super()

        this.rpc_methods = {}

        // stores all connected sockets with a universally unique identifier
        this.clients = new Map()

        // stores all events as keys and subscribed users in array as value
        this.events = {}

        this.wss = new WebSocketServer(options, () => this.emit("listening"))

        this.wss.on("connection", (socket) =>
        {
            const path = url.parse(socket.upgradeReq.url, true).pathname.split("/")
            socket._id = uuid.v1()

            // cleanup after the socket get disconnected
            socket.on("close", () =>
            {
                this.clients.delete(socket._id)

                for (const event of Object.keys(this.events))
                {
                    const index = this.events[event].indexOf(socket._id)

                    if (index === 0)
                        this.events[event].splice(index, 1)
                }
            })

            // use an RPC handler if rpc request
            if (options.rpc && "/" + path[1] === options.rpc.root_path)
            {
                if (path[2] !== options.rpc.version)
                    return socket.close(404)

                // store socket
                this.clients.set(socket._id, socket)

                return this._handleRPC(socket)
            }
        })

        this.wss.on("error", (error) => this.emit("error", error))
    }

    /**
     * Registers an RPC method.
     * @method
     * @param {String} name - method name
     * @param {Function} fn - a callee function
     * @throws {TypeError}
     * @return {Undefined}
     */
    register(name, fn)
    {
        assertArgs(arguments, {
            name: "string",
            fn: "function"
        })

        this.rpc_methods[name] = fn
    }

    /**
     * Creates a new event that can be emitted to clients.
     * @method
     * @param {String} name - event name
     * @throws {TypeError}
     * @return {Undefined}
     */
    event(name)
    {
        assertArgs(arguments, {
            "name": "string",
        })

        this.events[name] = []

        // forward emitted event to subscribers
        this.on(name, (...params) =>
        {
            for (const socket_id of this.events[name])
            {
                this.clients.get(socket_id).send(JSON.stringify({
                    notification: name,
                    params: params || null
                }))
            }
        })
    }

    /**
     * Lists all created events.
     * @method
     * @readonly
     * @return {Array} - returns a list of created events
     */
    get eventList()
    {
        return Object.keys(this.events)
    }

    /**
     * Creates a JSON-RPC 2.0 compliant error
     * @method
     * @param {Number} code - indicates the error type that occurred
     * @param {String} message - provides a short description of the error
     * @param {String|Object} data - details containing additional information about the error
     * @return {Object}
     */
    createError(code, message, data)
    {
        assertArgs(arguments, {
            "code": "number",
            "message": "string",
            "[data]": ["string", "object"]
        })

        return {
            code: code,
            message: message,
            data: data || null
        }
    }

    /**
     * Closes the server and terminates all clients.
     * @method
     * @return {Promise}
     */
    close()
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                this.wss.close(function(error)
                {
                    if (error)
                        return reject(error)

                    resolve()
                })
            }

            catch (error) { reject(error) }
        })
    }

    /**
     * Handles all WebSocket JSON RPC 2.0 requests.
     * @private
     * @param {Object} socket - ws socket instance
     * @return {Undefined}
     */
    _handleRPC(socket)
    {
        socket.on("message", async(data) =>
        {
            try { data = JSON.parse(data) }

            catch (error)
            {
                return socket.send(JSON.stringify({
                    jsonrpc: "2.0",
                    error: utils.createError(-32700, error.toString()),
                    id: data.id || null
                }))
            }

            if (Array.isArray(data))
            {
                if (!data.length)
                    return socket.send(JSON.stringify({
                        jsonrpc: "2.0",
                        error: utils.createError(-32600, "Invalid array"),
                        id: null
                    }))

                const responses = []

                for (const message of data)
                {
                    const response = await this._runMethod(message, socket._id)

                    if (!response)
                        continue

                    responses.push(response)
                }

                if (!responses.length)
                    return

                return socket.send(JSON.stringify(responses))
            }

            const response = await this._runMethod(data, socket._id)

            if (!response)
                return

            return socket.send(JSON.stringify(response))
        })
    }

    /**
     * Runs a defined RPC method.
     * @private
     * @param {Object} message - a message received
     * @param {Object} socket_id - user's socket id
     * @return {Object|undefined}
     */
    async _runMethod(message, socket_id)
    {
        if (typeof message !== "object")
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32600),
                id: null
            }

        if (message.jsonrpc !== "2.0")
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32600, "Invalid JSON RPC version"),
                id: message.id || null
            }

        if (!message.method)
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32602, "Method not specified"),
                id: message.id || null
            }

        if (typeof message.method !== "string")
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32600, "Invalid method name"),
                id: message.id || null
            }

        if (message.params && typeof message.params === "string")
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32600),
                id: message.id || null
            }

        if (message.method === "rpc.on")
        {
            if (!message.params)
                return {
                    jsonrpc: "2.0",
                    error: utils.createError(-32000),
                    id: message.id || null
                }

            const results = {}

            for (const name of message.params)
            {
                for (const event of Object.keys(this.events))
                {
                    if (event === name)
                    {
                        this.events[event].push(socket_id)

                        results[name] = "ok"
                        break
                    }
                }
            }

            if (!Object.keys(results).length)
                return {
                    jsonrpc: "2.0",
                    result: "provided event invalid",
                    id: message.id || null
                }

            return {
                jsonrpc: "2.0",
                result: results,
                id: message.id || null
            }
        }
        else if (message.method === "rpc.off")
        {
            if (!message.params)
                return {
                    jsonrpc: "2.0",
                    error: utils.createError(-32000),
                    id: message.id || null
                }

            const results = {}

            for (const name of message.params)
            {
                if (!this.events[name])
                {
                    results[name] = "provided event invalid"
                    continue
                }

                const index = this.events[name].indexOf(socket_id)

                if (index === -1)
                {
                    results[name] = "not subscribed"
                    continue
                }

                this.events[name].splice(index, 1)
                results[name] = "ok"
            }

            return {
                jsonrpc: "2.0",
                result: results,
                id: message.id || null
            }
        }

        if (!this.rpc_methods[message.method])
        {
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32601),
                id: message.id || null
            }
        }

        let response = null

        try { response = await this.rpc_methods[message.method](message.params) }

        catch (error)
        {
            if (!message.id)
                return

            if (error instanceof Error)
                return {
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message: error.name,
                        data: error.message
                    },
                    id: message.id
                }

            return {
                jsonrpc: "2.0",
                error: error,
                id: message.id
            }
        }

        // client sent a notification, so we won't need a reply
        if (!message.id)
            return

        return {
            jsonrpc: "2.0",
            result: response,
            id: message.id
        }
    }
}
