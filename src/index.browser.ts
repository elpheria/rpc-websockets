"use strict"

import { WebSocket } from "./lib/client/websocket.browser.js"
import { CommonClient } from "./lib/client.js"
import { IWSClientAdditionalOptions } from "./lib/client/client.types.js"

export class Client extends CommonClient
{
    constructor(
        address = "ws://localhost:8080",
        {
            autoconnect = true,
            reconnect = true,
            reconnect_interval = 1000,
            max_reconnects = 5,
        }: IWSClientAdditionalOptions = {},
        generate_request_id?: (
      method: string,
      params: object | Array<any>
    ) => number
    )
    {
        super(
            WebSocket,
            address,
            {
                autoconnect,
                reconnect,
                reconnect_interval,
                max_reconnects,
            },
            generate_request_id
        )
    }
}

export * from "./lib/client.js"
export * from "./lib/client/websocket.browser.js"
export * from "./lib/client/client.types.js"
export * from "./lib/utils.js"
