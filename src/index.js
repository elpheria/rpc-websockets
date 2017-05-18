"use strict"

import WebSocket from "./lib/client/websocket"
import clientFactory from "./lib/client"

export const Client = clientFactory(WebSocket)
export {default as Server} from "./lib/server"
