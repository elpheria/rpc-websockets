/* A wrapper for the "qaap/uws-bindings" library. */
"use strict";
import WebSocket from "ws";
export default function (address, options) {
    return new WebSocket(address, options);
}
