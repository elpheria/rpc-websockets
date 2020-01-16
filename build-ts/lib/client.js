/**
 * "Client" wraps "ws" or a browser-implemented "WebSocket" library
 * according to the environment providing JSON RPC 2.0 support on top.
 * @module Client
 */
"use strict";
// @ts-ignore
import assertArgs from "assert-args";
import { EventEmitter } from "eventemitter3";
import CircularJSON from "circular-json";
export default class CommonClient extends EventEmitter {
    /**
     * Instantiate a Client class.
     * @constructor
     * @param {webSocketFactory} webSocketFactory - factory method for WebSocket
     * @param {String} address - url to a websocket server
     * @param {Object} options - ws options object with reconnect parameters
     * @param {Function} generate_request_id - custom generation request Id
     * @return {CommonClient}
     */
    constructor(webSocketFactory, address = "ws://localhost:8080", { autoconnect = true, reconnect = true, reconnect_interval = 1000, max_reconnects = 5 } = {}, generate_request_id) {
        super();
        this.webSocketFactory = webSocketFactory;
        this.queue = {};
        this.rpc_id = 0;
        this.address = address;
        this.options = arguments[2];
        this.autoconnect = autoconnect;
        this.ready = false;
        this.reconnect = reconnect;
        this.reconnect_interval = reconnect_interval;
        this.max_reconnects = max_reconnects;
        this.current_reconnects = 0;
        this.generate_request_id = generate_request_id || (() => ++this.rpc_id);
        if (this.autoconnect)
            this._connect(this.address, this.options);
    }
    /**
     * Connects to a defined server if not connected already.
     * @method
     * @return {Undefined}
     */
    connect() {
        if (this.socket)
            return;
        this._connect(this.address, this.options);
    }
    /**
     * Calls a registered RPC method on server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object|Array} params - optional method parameters
     * @param {Number} timeout - RPC reply timeout value
     * @param {Object} ws_opts - options passed to ws
     * @return {Promise}
     */
    call(method, params, timeout, ws_opts) {
        assertArgs(arguments, {
            "method": "string",
            "[params]": ["object", Array],
            "[timeout]": "number",
            "[ws_opts]": "object"
        });
        if (!ws_opts && "object" === typeof timeout) {
            ws_opts = timeout;
            timeout = null;
        }
        return new Promise((resolve, reject) => {
            if (!this.ready)
                return reject(new Error("socket not ready"));
            const rpc_id = this.generate_request_id(method, params);
            const message = {
                jsonrpc: "2.0",
                method: method,
                params: params || null,
                id: rpc_id
            };
            this.socket.send(JSON.stringify(message), ws_opts, (error) => {
                if (error)
                    return reject(error);
                this.queue[rpc_id] = { promise: [resolve, reject] };
                if (timeout) {
                    this.queue[rpc_id].timeout = setTimeout(() => {
                        this.queue[rpc_id] = null;
                        reject(new Error("reply timeout"));
                    }, timeout);
                }
            });
        });
    }
    /**
     * Logins with the other side of the connection.
     * @method
     * @param {Object} params - Login credentials object
     * @return {Promise}
     */
    async login(params) {
        return await this.call("rpc.login", params);
    }
    /**
     * Fetches a list of client's methods registered on server.
     * @method
     * @return {Array}
     */
    async listMethods() {
        return await this.call("__listMethods");
    }
    /**
     * Sends a JSON-RPC 2.0 notification to server.
     * @method
     * @param {String} method - RPC method name
     * @param {Object} params - optional method parameters
     * @return {Promise}
     */
    notify(method, params) {
        assertArgs(arguments, {
            "method": "string",
            "[params]": ["object", Array]
        });
        return new Promise((resolve, reject) => {
            if (!this.ready)
                return reject(new Error("socket not ready"));
            const message = {
                jsonrpc: "2.0",
                method: method,
                params: params || null
            };
            this.socket.send(JSON.stringify(message), (error) => {
                if (error)
                    return reject(error);
                resolve();
            });
        });
    }
    /**
     * Subscribes for a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async subscribe(event) {
        assertArgs(arguments, {
            event: ["string", Array]
        });
        if (typeof event === "string")
            event = [event];
        const result = await this.call("rpc.on", event);
        if (typeof event === "string" && result[event] !== "ok")
            throw new Error("Failed subscribing to an event '" + event + "' with: " + result[event]);
        return result;
    }
    /**
     * Unsubscribes from a defined event.
     * @method
     * @param {String|Array} event - event name
     * @return {Undefined}
     * @throws {Error}
     */
    async unsubscribe(event) {
        assertArgs(arguments, {
            event: ["string", Array]
        });
        if (typeof event === "string")
            event = [event];
        const result = await this.call("rpc.off", event);
        if (typeof event === "string" && result[event] !== "ok")
            throw new Error("Failed unsubscribing from an event with: " + result);
        return result;
    }
    /**
     * Closes a WebSocket connection gracefully.
     * @method
     * @param {Number} code - socket close code
     * @param {String} data - optional data to be sent before closing
     * @return {Undefined}
     */
    close(code, data) {
        this.socket.close(code || 1000, data);
    }
    /**
     * Connection/Message handler.
     * @method
     * @private
     * @param {String} address - WebSocket API address
     * @param {Object} options - ws options object
     * @return {Undefined}
     */
    _connect(address, options) {
        this.socket = this.webSocketFactory(address, options);
        this.socket.addEventListener("open", () => {
            this.ready = true;
            this.emit("open");
            this.current_reconnects = 0;
        });
        this.socket.addEventListener("message", ({ data: message }) => {
            if (message instanceof ArrayBuffer)
                message = Buffer.from(message).toString();
            try {
                message = CircularJSON.parse(message);
            }
            catch (error) {
                return;
            }
            // check if any listeners are attached and forward event
            if (message.notification && this.listeners(message.notification).length) {
                if (!Object.keys(message.params).length)
                    return this.emit(message.notification);
                const args = [message.notification];
                if (message.params.constructor === Object)
                    args.push(message.params);
                else
                    // using for-loop instead of unshift/spread because performance is better
                    for (let i = 0; i < message.params.length; i++)
                        args.push(message.params[i]);
                return this.emit.apply(this, args);
            }
            if (!this.queue[message.id]) {
                // general JSON RPC 2.0 events
                if (message.method && message.params)
                    return this.emit(message.method, message.params);
                else
                    return;
            }
            if (this.queue[message.id].timeout)
                clearTimeout(this.queue[message.id].timeout);
            if (message.error)
                this.queue[message.id].promise[1](message.error);
            else
                this.queue[message.id].promise[0](message.result);
            this.queue[message.id] = null;
        });
        this.socket.addEventListener("error", (error) => this.emit("error", error));
        this.socket.addEventListener("close", ({ code, reason }) => {
            if (this.ready)
                this.emit("close", code, reason);
            this.ready = false;
            if (code === 1000)
                return;
            this.current_reconnects++;
            if (this.reconnect && ((this.max_reconnects > this.current_reconnects) ||
                this.max_reconnects === 0))
                setTimeout(() => this._connect(address, options), this.reconnect_interval);
        });
    }
}
