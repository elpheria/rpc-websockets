/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */

"use strict"

// @ts-ignore
import assertArgs from "assert-args"
import EventEmitter from "eventemitter3"
import NodeWebSocket, { Server as WebSocketServer } from "ws"
import uuid from "uuid"
import url from "url"
import CircularJSON from "circular-json"

import * as utils from "./utils"

interface INamespaceEvent {
    [x: string]: Array<string>;
}

interface IRPCMethodParams {
    [x: string]: any;
}

interface IRPCMethod {
    [x: string]: {
        fn: (params: IRPCMethodParams) => any;
        protected: boolean;
    };
}

interface INamespace {
    [x: string]: {
        rpc_methods: IRPCMethod;
        clients: Map<string, IWebSocketWithId>;
        events: INamespaceEvent;
    }
}

interface IWebSocketWithId extends NodeWebSocket {
    _id: string;
}

interface IRPCResult {
    [x: string]: string;
}

export default class Server extends EventEmitter
{
    private namespaces: INamespace;
    private authenticated: boolean;
    wss: InstanceType<typeof WebSocketServer>;

    /**
     * Instantiate a Server class.
     * @constructor
     * @param {Object} options - ws constructor's parameters with rpc
     * @return {Server} - returns a new Server instance
     */
    constructor(options: NodeWebSocket.ServerOptions)
    {
        super()

        /**
         * Stores all connected sockets with a universally unique identifier
         * in the appropriate namespace.
         * Stores all rpc methods to specific namespaces. "/" by default.
         * Stores all events as keys and subscribed users in array as value
         * @private
         * @name namespaces
         * @param {Object} namespaces.rpc_methods
         * @param {Map} namespaces.clients
         * @param {Object} namespaces.events
         */
        this.namespaces = {}
        this.authenticated = false

        this.wss = new WebSocketServer(options)

        this.wss.on("listening", () => this.emit("listening"))

        this.wss.on("connection", (socket: IWebSocketWithId, request) =>
        {
            this.emit("connection", socket, request)

            const u = url.parse(request.url, true)
            const ns = u.pathname

            if (u.query.socket_id)
                socket._id = u.query.id as string;
            else
                socket._id = uuid.v1()

            // cleanup after the socket gets disconnected
            socket.on("close", () =>
            {
                this.namespaces[ns].clients.delete(socket._id)

                for (const event of Object.keys(this.namespaces[ns].events))
                {
                    const index = this.namespaces[ns].events[event].indexOf(socket._id)

                    if (index >= 0)
                        this.namespaces[ns].events[event].splice(index, 1)
                }
            })

            if (!this.namespaces[ns]) this._generateNamespace(ns)

            // store socket and method
            this.namespaces[ns].clients.set(socket._id, socket)

            return this._handleRPC(socket, ns)
        })

        this.wss.on("error", (error) => this.emit("error", error))
    }

    /**
     * Registers an RPC method.
     * @method
     * @param {String} name - method name
     * @param {Function} fn - a callee function
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Object} - returns the RPCMethod object
     */
    register(name: string, fn: (params: IRPCMethodParams) => void, ns: string = "/")
    {
        assertArgs(arguments, {
            name: "string",
            fn: "function",
            "[ns]": "string"
        })

        if (!this.namespaces[ns]) this._generateNamespace(ns)

        this.namespaces[ns].rpc_methods[name] = {
            fn: fn,
            protected: false
        }

        return {
            protected: () => this._makeProtected(name, ns),
            public: () => this._makePublic(name, ns)
        }
    }

    /**
     * Sets an auth method.
     * @method
     * @param {Function} fn - an arbitrary auth method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    setAuth(fn: (params: IRPCMethodParams) => boolean, ns: string = "/")
    {
        this.register("rpc.login", fn, ns)
    }

    /**
     * Marks an RPC method as protected.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */
    private _makeProtected(name: string, ns: string = "/")
    {
        this.namespaces[ns].rpc_methods[name].protected = true
    }

    /**
     * Marks an RPC method as public.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */
    private _makePublic(name: string, ns: string = "/")
    {
        this.namespaces[ns].rpc_methods[name].protected = false
    }

    /**
     * Removes a namespace and closes all connections
     * @method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    closeNamespace(ns: string)
    {
        assertArgs(arguments, {
            ns: "string"
        })

        var namespace = this.namespaces[ns]

        if (namespace)
        {
            delete namespace.rpc_methods
            delete namespace.events

            for (const socket of namespace.clients.values())
                socket.close()

            delete this.namespaces[ns]
        }
    }

    /**
     * Creates a new event that can be emitted to clients.
     * @method
     * @param {String} name - event name
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    event(name: string, ns: string = "/")
    {
        assertArgs(arguments, {
            "name": "string",
            "[ns]": "string"
        })

        if (!this.namespaces[ns]) this._generateNamespace(ns)
        else
        {
            const index = this.namespaces[ns].events[name]

            if (index !== undefined)
                throw new Error(`Already registered event ${ns}${name}`)
        }

        this.namespaces[ns].events[name] = []

        // forward emitted event to subscribers
        this.on(name, (...params) =>
        {
            // flatten an object if no spreading is wanted
            if (params.length === 1 && params[0] instanceof Object)
                params = params[0]

            for (const socket_id of this.namespaces[ns].events[name])
            {
                const socket = this.namespaces[ns].clients.get(socket_id)

                if (!socket)
                    continue

                socket.send(CircularJSON.stringify({
                    notification: name,
                    params: params || null
                }))
            }
        })
    }

    /**
     * Returns a requested namespace object
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Object} - namespace object
     */
    of(name: string)
    {
        assertArgs(arguments, {
            "name": "string",
        })

        if (!this.namespaces[name]) this._generateNamespace(name)

        const self = this

        return {
            // self.register convenience method
            register(fn_name: string, fn: (params: IRPCMethodParams) => void)
            {
                if (arguments.length !== 2)
                    throw new Error("must provide exactly two arguments")

                if (typeof fn_name !== "string")
                    throw new Error("name must be a string")

                if (typeof fn !== "function")
                    throw new Error("handler must be a function")

                return self.register(fn_name, fn, name)
            },

            // self.event convenience method
            event(ev_name: string)
            {
                if (arguments.length !== 1)
                    throw new Error("must provide exactly one argument")

                if (typeof ev_name !== "string")
                    throw new Error("name must be a string")

                self.event(ev_name, name)
            },

            // self.eventList convenience method
            get eventList()
            {
                return Object.keys(self.namespaces[name].events)
            },

            /**
             * Emits a specified event to this namespace.
             * @inner
             * @method
             * @param {String} event - event name
             * @param {Array} params - event parameters
             * @return {Undefined}
             */
            emit(event: string, params: Array<string>)
            {
                const socket_ids = [ ...self.namespaces[name].clients.keys() ]

                for (var i = 0, id; id = socket_ids[i]; ++i)
                {
                    self.namespaces[name].clients.get(id).send(CircularJSON.stringify({
                        notification: event,
                        params: params || []
                    }))
                }
            },

            /**
             * Returns a name of this namespace.
             * @inner
             * @method
             * @kind constant
             * @return {String}
             */
            get name()
            {
                return name
            },

            /**
             * Returns a hash of websocket objects connected to this namespace.
             * @inner
             * @method
             * @return {Object}
             */
            connected()
            {
                const socket_ids = [ ...self.namespaces[name].clients.keys() ]

                return socket_ids.reduce((acc, curr) => ({
                    ...acc,
                    [curr]: self.namespaces[name].clients.get(curr)
                }), {});
            },

            /**
             * Returns a list of client unique identifiers connected to this namespace.
             * @inner
             * @method
             * @return {Array}
             */
            clients()
            {
                return self.namespaces[name]
            }
        }
    }

    /**
     * Lists all created events in a given namespace. Defaults to "/".
     * @method
     * @param {String} ns - namespaces identifier
     * @readonly
     * @return {Array} - returns a list of created events
     */
    eventList(ns: string = "/")
    {
        assertArgs(arguments, {
            "[ns]": "string",
        })

        if (!this.namespaces[ns]) return []

        return Object.keys(this.namespaces[ns].events)
    }

    /**
     * Creates a JSON-RPC 2.0 compliant error
     * @method
     * @param {Number} code - indicates the error type that occurred
     * @param {String} message - provides a short description of the error
     * @param {String|Object} data - details containing additional information about the error
     * @return {Object}
     */
    createError(code: number, message: string, data: string | object)
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
                this.wss.close()
                resolve()
            }

            catch (error) { reject(error) }
        })
    }

    /**
     * Handles all WebSocket JSON RPC 2.0 requests.
     * @private
     * @param {Object} socket - ws socket instance
     * @param {String} ns - namespaces identifier
     * @return {Undefined}
     */
    private _handleRPC(socket: IWebSocketWithId, ns = "/")
    {
        socket.on("message", async(data) =>
        {
            const msg_options: Parameters<NodeWebSocket['send']>[1] = {}

            if (data instanceof ArrayBuffer)
            {
                msg_options.binary = true

                data = Buffer.from(data).toString()
            }

            let parsedData: any;

            try { parsedData = JSON.parse(data as string) }

            catch (error)
            {
                return socket.send(JSON.stringify({
                    jsonrpc: "2.0",
                    error: utils.createError(-32700, error.toString()),
                    id: null
                }), msg_options)
            }

            if (Array.isArray(parsedData))
            {
                if (!parsedData.length)
                    return socket.send(JSON.stringify({
                        jsonrpc: "2.0",
                        error: utils.createError(-32600, "Invalid array"),
                        id: null
                    }), msg_options)

                const responses = []

                for (const message of parsedData)
                {
                    const response = await this._runMethod(message, socket._id, ns)

                    if (!response)
                        continue

                    responses.push(response)
                }

                if (!responses.length)
                    return

                return socket.send(CircularJSON.stringify(responses), msg_options)
            }

            const response = await this._runMethod(parsedData, socket._id, ns)

            if (!response)
                return

            return socket.send(CircularJSON.stringify(response), msg_options)
        })
    }

    /**
     * Runs a defined RPC method.
     * @private
     * @param {Object} message - a message received
     * @param {Object} socket_id - user's socket id
     * @param {String} ns - namespaces identifier
     * @return {Object|undefined}
     */
    private async _runMethod(message: any, socket_id: string, ns: string = "/")
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

            const results: IRPCMethodParams = {}

            const event_names = Object.keys(this.namespaces[ns].events)

            for (const name of message.params)
            {
                const index = event_names.indexOf(name)
                const namespace = this.namespaces[ns]

                if (index === -1)
                {
                    results[name] = "provided event invalid"
                    continue
                }

                const socket_index = namespace.events[event_names[index]].indexOf(socket_id)
                if (socket_index >= 0)
                {
                    results[name] = "socket has already been subscribed to event"
                    continue
                }
                namespace.events[event_names[index]].push(socket_id)

                results[name] = "ok"
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

            const results: IRPCResult = {}

            for (const name of message.params)
            {
                if (!this.namespaces[ns].events[name])
                {
                    results[name] = "provided event invalid"
                    continue
                }

                const index = this.namespaces[ns].events[name].indexOf(socket_id)

                if (index === -1)
                {
                    results[name] = "not subscribed"
                    continue
                }

                this.namespaces[ns].events[name].splice(index, 1)
                results[name] = "ok"
            }

            return {
                jsonrpc: "2.0",
                result: results,
                id: message.id || null
            }
        }
        else if (message.method === "rpc.login")
        {
            if (!message.params)
                return {
                    jsonrpc: "2.0",
                    error: utils.createError(-32604),
                    id: message.id || null
                }
        }

        if (!this.namespaces[ns].rpc_methods[message.method])
        {
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32601),
                id: message.id || null
            }
        }

        let response = null

        // reject request if method is protected and if client is not authenticated
        if (this.namespaces[ns].rpc_methods[message.method].protected === true &&
            this.authenticated === false)
        {
            return {
                jsonrpc: "2.0",
                error: utils.createError(-32605),
                id: message.id || null
            }
        }

        try { response = await this.namespaces[ns].rpc_methods[message.method].fn(message.params) }

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

        // if login middleware returned true, set connection as authenticated
        if (message.method === "rpc.login" && response === true)
            this.authenticated = true

        return {
            jsonrpc: "2.0",
            result: response,
            id: message.id
        }
    }

    /**
     * Generate a new namespace store.
     * Also preregister some special namespace methods.
     * @private
     * @param {String} name - namespaces identifier
     * @return {undefined}
     */
    private _generateNamespace(name: string)
    {
        this.namespaces[name] = {
            rpc_methods: {
                "__listMethods": {
                    fn: () => Object.keys(this.namespaces[name].rpc_methods),
                    protected: false
                }
            },
            clients: new Map(),
            events: {}
        }
    }
}
