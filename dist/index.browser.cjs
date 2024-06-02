"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const websocket_browser_cjs_1 = __importDefault(require("./lib/client/websocket.browser.cjs"));
const client_cjs_1 = __importDefault(require("./lib/client.cjs"));
class Client extends client_cjs_1.default {
    constructor(address = "ws://localhost:8080", { autoconnect = true, reconnect = true, reconnect_interval = 1000, max_reconnects = 5 } = {}, generate_request_id) {
        super(websocket_browser_cjs_1.default, address, {
            autoconnect,
            reconnect,
            reconnect_interval,
            max_reconnects
        }, generate_request_id);
    }
}
exports.Client = Client;
