import NodeWebSocket from "ws"

export type BrowserWebSocketType = InstanceType<typeof WebSocket>;
export type BrowserWebSocketTypeOptions = NodeWebSocket.ClientOptions;
export type NodeWebSocketType = InstanceType<typeof NodeWebSocket>;
export type NodeWebSocketTypeOptions = NodeWebSocket.ClientOptions;

export type TCommonWebSocket = WebSocket & NodeWebSocket

export interface ICommonWebSocketFactory {
    (
        address: string,
        options: BrowserWebSocketTypeOptions | NodeWebSocketTypeOptions
    ): TCommonWebSocket;
}
