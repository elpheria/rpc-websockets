/* A wrapper for the "qaap/uws-bindings" library. */

"use strict"

import WebSocket from "ws"
/**
 * Sends data through a websocket connection
 * @method
 * @param {String} address - url to a websocket server
 * @param {(Object)} options - websocket options
 * @return {Undefined}
 */
export default function (address, options)
{
    return new WebSocket(address, options)
}
