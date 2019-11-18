import {TCommonWebSocket} from "../common.types"

interface IJsonRpcSocket {
    // TODO: IRpcSocket interface
    getId(): TJsonRpcSocketId;
    getSocket(): TCommonWebSocket;
    close(code: number, reason?: string): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(
        data: any,
        options?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean },
        cb?: (err?: Error) => void
    ): void;
    sendNotification(
        method: TRpcNotificationName,
        params: TRpcNotificationParams
    ): Promise<void>
    sendInternalNotification(
        method: TRpcNotificationName,
        params: TRpcNotificationParams
    ): Promise<void>
    listRemoteEvents(): Promise<Array<string>>
    listRemoteMethods(): Promise<Array<string>>
    callMethod(
        method: TRpcRequestName,
        params?: TRpcRequestParams,
        waitTime?: number,
        wsOptions?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }
    ): any
    callInternalMethod(
        method: TRpcRequestName,
        params?: TRpcRequestParams,
        waitTime?: number,
        wsOptions?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }
    ): any
}

interface IJsonRPCSocketOptions {
    generate_request_id?: (method: string, params: object | Array<any>) => TRpcRequestId
}

type TJsonRpcSocketId = string;

type TRpcRequestId = number | string;
type TRpcRequestName = string;
type TRpcRequestParams = any;
type TRpcRequestHandler = (params: TRpcRequestParams, socket: IJsonRpcSocket) => any;
interface IRpcRequest {
    method: string,
    params: TRpcRequestParams
}
interface IRpcResponder {
    isSent: () => boolean
    throw: (error: {code: number, message: string}, additionalData?: any) => any
    send: (data: any) => any
}

type TRpcNotificationName = string;
type TRpcNotificationParams = any;
type TRpcNotificationHandler = (params: TRpcNotificationParams, socket: IJsonRpcSocket) => any;

// TODO: remove this when typescript will be supported in json-rpc-msg library:
interface IParsedRpcMessage {
    type: "request" | "internal_request" |
        "notification" | "internal_notification" |
        "response" | "error" |
        "batch"
    payload: object
}
interface IParsedRpcRequest extends IParsedRpcMessage {
    type: "request",
    payload: {
        id: TRpcRequestId
        method: TRpcRequestName,
        params: any
    }
}
interface IParsedRpcInternalRequest extends IParsedRpcMessage {
    type: "internal_request",
    payload: {
        id: TRpcRequestId
        method: TRpcRequestName,
        params: any
    }
}
interface IParsedRpcNotification extends IParsedRpcMessage {
    type: "notification"
    payload: {
        method: TRpcNotificationName,
        params: any
    }
}
interface IParsedRpcInternalNotification extends IParsedRpcMessage {
    type: "internal_notification"
    payload: {
        method: TRpcNotificationName,
        params: any
    }
}
interface IParsedRpcResponse extends IParsedRpcMessage {
    type: "response"
    payload: {
        id: TRpcRequestId
        result: any
    }
}
interface IParsedRpcError extends IParsedRpcMessage {
    type: "error",
    payload: {
        id: TRpcRequestId,
        error: {
            code: number,
            message: string,
            data: any
        }
    }
}
interface IParsedRpcBatch extends IParsedRpcMessage {
    type: "batch",
    payload: Array<TParsedRpcSimpleMessage>
}

type TParsedRpcSimpleMessage = IParsedRpcRequest |
    IParsedRpcInternalRequest |
    IParsedRpcNotification |
    IParsedRpcInternalNotification |
    IParsedRpcResponse |
    IParsedRpcError;

type TParsedRpcMessage = TParsedRpcSimpleMessage | IParsedRpcBatch;

export {
    IJsonRpcSocket,
    TJsonRpcSocketId,
    IJsonRPCSocketOptions,

    TRpcRequestId,
    TRpcRequestName,
    TRpcRequestParams,
    TRpcRequestHandler,
    IRpcRequest,

    TRpcNotificationName,
    TRpcNotificationParams,
    TRpcNotificationHandler,

    IRpcResponder,

    // Parsed RPC message types:
    IParsedRpcRequest,
    IParsedRpcInternalRequest,
    IParsedRpcNotification,
    IParsedRpcInternalNotification,
    IParsedRpcResponse,
    IParsedRpcError,
    TParsedRpcSimpleMessage,
    TParsedRpcMessage
}