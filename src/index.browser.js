"use strict"

import WebSocket from "./lib/client/websocket.browser"
import clientFactory from "./lib/client"

export const Client = clientFactory(WebSocket)