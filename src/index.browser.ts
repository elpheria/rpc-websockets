"use strict"

import WebSocketBrowserImpl from "./lib/client/websocket.browser"
import clientFactory from "./lib/client"

export const Client = clientFactory(WebSocketBrowserImpl)

const a = new Client("/asdasd");