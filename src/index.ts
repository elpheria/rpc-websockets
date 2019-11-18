"use strict"

import WebSocket from "./lib/client/websocket"
import CommonClient from "./lib/client"
import { IWSClientAdditionalOptions } from "./lib/client/types"
import { NodeWebSocketTypeOptions} from "./lib/common.types"

export class Client extends CommonClient
{
    constructor(
        address: string,
        options?: IWSClientAdditionalOptions & NodeWebSocketTypeOptions,
        generate_request_id?: (method: string, params: object | Array<any>) => number
    )
    {
        super(
            WebSocket,
            address,
            options,
            generate_request_id
        )
    }
}

export {default as Server} from "./lib/server"
