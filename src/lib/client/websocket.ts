/* A wrapper for the "qaap/uws-bindings" library. */

"use strict"

import WebSocket from "ws"
import { IWSClientAdditionalOptions } from "./client.types"

export default function(address: string, options: IWSClientAdditionalOptions & WebSocket.ClientOptions) {
    return new WebSocket(address, options);
}
