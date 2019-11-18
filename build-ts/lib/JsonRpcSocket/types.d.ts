import { TCommonWebSocket } from "../common.types";
interface IJsonRpcSocket {
    getId(): TJsonRpcSocketId;
    getSocket(): TCommonWebSocket;
    close(code: number, reason?: string): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(data: any, options?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }, cb?: (err?: Error) => void): void;
    sendNotification(method: TRpcNotificationName, params: TRpcNotificationParams): Promise<void>;
    sendInternalNotification(method: TRpcNotificationName, params: TRpcNotificationParams): Promise<void>;
    listRemoteEvents(): Promise<Array<string>>;
    listRemoteMethods(): Promise<Array<string>>;
    callMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): any;
    callInternalMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): any;
}
interface IJsonRPCSocketOptions {
    generate_request_id?: (method: string, params: object | Array<any>) => TRpcRequestId;
}
declare type TJsonRpcSocketId = string;
declare type TRpcRequestId = number | string;
declare type TRpcRequestName = string;
declare type TRpcRequestParams = any;
declare type TRpcRequestHandler = (params: TRpcRequestParams, socket: IJsonRpcSocket) => any;
interface IRpcRequest {
    method: string;
    params: TRpcRequestParams;
}
interface IRpcResponder {
    isSent: () => boolean;
    throw: (error: {
        code: number;
        message: string;
    }, additionalData?: any) => any;
    send: (data: any) => any;
}
declare type TRpcNotificationName = string;
declare type TRpcNotificationParams = any;
declare type TRpcNotificationHandler = (params: TRpcNotificationParams, socket: IJsonRpcSocket) => any;
interface IParsedRpcMessage {
    type: "request" | "internal_request" | "notification" | "internal_notification" | "response" | "error" | "batch";
    payload: object;
}
interface IParsedRpcRequest extends IParsedRpcMessage {
    type: "request";
    payload: {
        id: TRpcRequestId;
        method: TRpcRequestName;
        params: any;
    };
}
interface IParsedRpcInternalRequest extends IParsedRpcMessage {
    type: "internal_request";
    payload: {
        id: TRpcRequestId;
        method: TRpcRequestName;
        params: any;
    };
}
interface IParsedRpcNotification extends IParsedRpcMessage {
    type: "notification";
    payload: {
        method: TRpcNotificationName;
        params: any;
    };
}
interface IParsedRpcInternalNotification extends IParsedRpcMessage {
    type: "internal_notification";
    payload: {
        method: TRpcNotificationName;
        params: any;
    };
}
interface IParsedRpcResponse extends IParsedRpcMessage {
    type: "response";
    payload: {
        id: TRpcRequestId;
        result: any;
    };
}
interface IParsedRpcError extends IParsedRpcMessage {
    type: "error";
    payload: {
        id: TRpcRequestId;
        error: {
            code: number;
            message: string;
            data: any;
        };
    };
}
interface IParsedRpcBatch extends IParsedRpcMessage {
    type: "batch";
    payload: Array<TParsedRpcSimpleMessage>;
}
declare type TParsedRpcSimpleMessage = IParsedRpcRequest | IParsedRpcInternalRequest | IParsedRpcNotification | IParsedRpcInternalNotification | IParsedRpcResponse | IParsedRpcError;
declare type TParsedRpcMessage = TParsedRpcSimpleMessage | IParsedRpcBatch;
export { IJsonRpcSocket, TJsonRpcSocketId, IJsonRPCSocketOptions, TRpcRequestId, TRpcRequestName, TRpcRequestParams, TRpcRequestHandler, IRpcRequest, TRpcNotificationName, TRpcNotificationParams, TRpcNotificationHandler, IRpcResponder, IParsedRpcRequest, IParsedRpcInternalRequest, IParsedRpcNotification, IParsedRpcInternalNotification, IParsedRpcResponse, IParsedRpcError, TParsedRpcSimpleMessage, TParsedRpcMessage };
