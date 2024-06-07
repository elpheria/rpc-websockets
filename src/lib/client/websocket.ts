/* A wrapper for the "qaap/uws-bindings" library. */

"use strict"

import WebSocketImpl from "ws"

import { IWSClientAdditionalOptions } from "./client.types.js"

/**
 * factory method for common WebSocket instance
 * @method
 * @param {String} address - url to a websocket server
 * @param {(Object)} options - websocket options
 * @return {Undefined}
 */
export function WebSocket(
    address: string,
    options: IWSClientAdditionalOptions & WebSocketImpl.ClientOptions
)
{
    return new WebSocketImpl(address, options)
}
