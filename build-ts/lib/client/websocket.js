/* A wrapper for the "qaap/uws-bindings" library. */
"use strict";
import WebSocket from "ws";
/**
 * factory method for common WebSocket instance
 * @method
 * @param {String} address - url to a websocket server
 * @param {(Object)} options - websocket options
 * @return {Undefined}
 */
export default function (address, options) {
    // TODO: check this conversion of types - looks like browser socket implementation
    //       have different API then WS.Socket instance:
    return new WebSocket(address, options);
}
