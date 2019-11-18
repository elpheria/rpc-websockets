/// <reference types="node" />
import EventEmitter from "eventemitter3";
import { IRpcRequest, IJsonRpcSocket, IJsonRPCSocketOptions, TJsonRpcSocketId, TRpcRequestId, TRpcRequestName, IParsedRpcNotification, IParsedRpcInternalNotification, IParsedRpcRequest, IParsedRpcInternalRequest, TRpcRequestParams, TRpcNotificationName, TRpcNotificationParams } from "./types";
import { TCommonWebSocket } from "../common.types";
/**
 * List additional JSON RPC errors
 *
 * @type {object}
 */
export declare const RPC_ERRORS: any;
/**
 * Constructor of error object, that should be thrown if server responded with error
 *
 * @param {{code: int, message: string, data: *?}} error - error data
 *
 * @constructor
 */
export declare class RPCServerError extends Error {
    message: string;
    code: number;
    data: any;
    stack: any;
    constructor(error: {
        message: string;
        code: number;
        data?: any;
    });
}
/**
 * Constructor of error object, that should be thrown if response was not received in given time
 * @constructor
 *
 * @param {object} request - failed request object
 */
export declare class TimeoutError extends Error {
    code: number;
    message: string;
    data: any;
    stack: any;
    constructor(request: IRpcRequest);
}
/**
 * Wrapper for WebSockets
 */
export default class JsonRPCSocket extends EventEmitter implements IJsonRpcSocket {
    static TimeoutError: typeof TimeoutError;
    static RPCServerError: typeof RPCServerError;
    static RPC_ERRORS: any;
    private options;
    private _pendingRequests;
    private _id;
    private _socket;
    constructor(socket: TCommonWebSocket, id: TJsonRpcSocketId, options?: IJsonRPCSocketOptions);
    /**
     * RPC message handler
     * @param {string|Buffer} data - received message
     * @returns {Promise<void>}
     * @private
     */
    _handleRpcMessage(data: string | Buffer | ArrayBuffer): Promise<void>;
    /**
     * Handle incoming notification
     * @param {object} message - received parsed message
     * @returns {void}
     * @private
     */
    _handleIncomingNotification(message: IParsedRpcNotification | IParsedRpcInternalNotification): void;
    /**
     * Handle incoming request
     * @param {object} message - parsed JSON-RPC request
     * @returns {Promise.<object>} - promise that on fullfilled returns JSON-RPC message
     * @private
     */
    _handleIncomingRequest(message: IParsedRpcRequest | IParsedRpcInternalRequest): Promise<any>;
    /**
     * Call remote method
     * @param {boolean} isInternal - should internal method be called or public
     * @param {string} method - method name to call
     * @param {object|array} params? - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response (ms)
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    _callMethod(isInternal: boolean, method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): Promise<unknown>;
    /**
     * Handle response from server
     *
     * @param {object} responseData - response data
     * @param {string|number} id - request ID
     * @param {*} result - result if response successful
     * @param {{code: number, message: string, data: (array|object)}} error - error
     *
     * @returns {void}
     *
     * @private
     */
    _handleRPCResponse(responseData: {
        id: TRpcRequestId;
        result?: any;
        error?: {
            code: number;
            message: string;
            data?: any;
        };
    }): void;
    /**
     * Returns ID of the socket
     *
     * @returns {number|string}
     */
    getId(): string;
    /**
     * Returns native websocket object
     *
     * @returns {WebSocket}
     */
    getSocket(): TCommonWebSocket;
    /**
     * Close the socket
     * @param {Number} code? - A numeric value indicating the status code
     *                        explaining why the connection is being closed.
     * @param {String} reason? - A human-readable string explaining why the connection is closing.
     * @returns {void}
     */
    close(code?: number, reason?: string): void;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): Promise<unknown>;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callInternalMethod(method: TRpcRequestName, params?: TRpcRequestParams, waitTime?: number, wsOptions?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    }): Promise<unknown>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteMethods(): Promise<string[]>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteEvents(): Promise<Array<string>>;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendNotification(method: TRpcNotificationName, params: TRpcNotificationParams): Promise<void>;
    /**
     * Sends given internal notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendInternalNotification(method: TRpcNotificationName, params: TRpcNotificationParams): Promise<void>;
    /**
     * Send given data
     *
     * @param {any} data - data to be sent
     * @param {object} options - options for websocket protocol
     * @param {function} cb - callback that will be invoked when data is sent
     *
     * @returns {*}
     */
    send(data: any, options?: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
    } | ((err?: Error) => void), cb?: (err?: Error) => void): any;
}
