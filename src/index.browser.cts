"use strict"

import WebSocketBrowserImpl from "./lib/client/websocket.browser.cjs"
import CommonClient from "./lib/client.cjs"
import { IWSClientAdditionalOptions } from "./lib/client/client.types.cjs"

export class Client extends CommonClient
{
    constructor(
        address = "ws://localhost:8080",
        {
            autoconnect = true,
            reconnect = true,
            reconnect_interval = 1000,
            max_reconnects = 5
        }: IWSClientAdditionalOptions = {},
        generate_request_id?: (method: string, params: object | Array<any>) => number
    )
    {
        super(
            WebSocketBrowserImpl,
            address,
            {
                autoconnect,
                reconnect,
                reconnect_interval,
                max_reconnects
            },
            generate_request_id
        )
    }
}