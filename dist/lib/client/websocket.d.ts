import { NodeWebSocketTypeOptions, TCommonWebSocket } from "../common.types";
/**
 * factory method for common WebSocket instance
 * @method
 * @param {String} address - url to a websocket server
 * @param {(Object)} options - websocket options
 * @return {Undefined}
 */
export default function (address: string, options: NodeWebSocketTypeOptions): TCommonWebSocket;
