/* A wrapper for the "qaap/uws-bindings" library. */
"use strict";
import WebSocket from "ws";
export default class NodeWebSocketImpl extends WebSocket {
    constructor(address, options) {
        super(address, options);
    }
}
