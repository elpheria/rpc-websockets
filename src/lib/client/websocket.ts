/* A wrapper for the "qaap/uws-bindings" library. */

"use strict"

import WebSocket from "ws"
import { IWSClientAdditionalOptions } from "./client.types"

export default class NodeWebSocketImpl extends WebSocket {
    constructor(address: string, options: IWSClientAdditionalOptions & WebSocket.ClientOptions) {
        super(address, options);
    }
}