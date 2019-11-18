"use strict";
import WebSocketBrowserImpl from "./lib/client/websocket.browser";
import CommonClient from "./lib/client";
export class Client extends CommonClient {
    constructor(address, options, generate_request_id) {
        super(WebSocketBrowserImpl, address, options, generate_request_id);
    }
}
