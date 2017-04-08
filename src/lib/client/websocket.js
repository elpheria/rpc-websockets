/* A wrapper for the "uWebSockets/bindings" library. */

"use strict"

import WebSocket from "uws"

module.exports = function(address, options)
{
    return new WebSocket(address, options)
}
