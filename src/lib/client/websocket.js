/* A wrapper for the "qaap/uws-bindings" library. */

"use strict"

import WebSocket from "qaap-uws"

module.exports = function(address, options)
{
    return new WebSocket(address, options)
}
