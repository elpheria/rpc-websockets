"use strict";
import WebSocket from "./lib/client/websocket";
import CommonClient from "./lib/client";
export class Client extends CommonClient {
    constructor(address, options, generate_request_id) {
        super(WebSocket, address, options, generate_request_id);
    }
}
export { default as Server } from "./lib/server";
