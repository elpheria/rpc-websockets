/**
 * WebSocket implements a browser-side WebSocket specification.
 * @module Client
 */

"use strict"

import EventEmitter from "eventemitter3"

export default class WebSocket extends EventEmitter
{
    /** Instantiate a WebSocket class
     * @constructor
     * @param {String} address - url to a websocket server
     * @param {(Object)} options - websocket options
     * @param {(String|Array)} protocols - a list of protocols
     * @return {WebSocket} - returns a WebSocket instance
     */
    constructor(address, options, protocols)
    {
        super()

        this.socket = new window.WebSocket(address, protocols)

        this.socket.onopen = () => this.emit("open")
        this.socket.onmessage = (event) => this.emit("message", event.data)
        this.socket.onerror = (error) => this.emit("error", error)
        this.socket.onclose = () => this.emit("close")
    }

    /**
     * Sends data through a websocket connection
     * @method
     * @param {(String|Object)} data - data to be sent via websocket
     * @param {Object} options - ws options
     * @param {Function} callback - a callback called once the data is sent
     * @return {Undefined}
     */
    send(data, options, callback)
    {
        callback = callback || options;
        
        try
        {
            this.socket.send(data)
            callback()
        }
        catch (error) { callback(error) }
    }

    /**
     * Closes an underlying socket
     * @method
     * @param {Number} code - status code explaining why the connection is being closed
     * @param {String} reason - a description why the connection is closing
     * @return {Undefined}
     * @throws {Error}
     */
    close(code, reason)
    {
        this.socket.close(code, reason)
    }
}
