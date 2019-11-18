import NodeWebSocket from "ws";
export declare type BrowserWebSocketType = InstanceType<typeof WebSocket>;
export declare type BrowserWebSocketTypeOptions = NodeWebSocket.ClientOptions;
export declare type NodeWebSocketType = InstanceType<typeof NodeWebSocket>;
export declare type NodeWebSocketTypeOptions = NodeWebSocket.ClientOptions;
export declare type TCommonWebSocket = WebSocket & NodeWebSocket;
export interface ICommonWebSocketFactory {
    (address: string, options: BrowserWebSocketTypeOptions | NodeWebSocketTypeOptions): TCommonWebSocket;
}
