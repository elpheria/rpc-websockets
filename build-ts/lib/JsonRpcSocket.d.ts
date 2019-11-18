/**
 * Constructor of error object, that should be thrown if server responded with error
 *
 * @param {{code: int, message: string, data: *?}} error - error data
 *
 * @constructor
 */
export function RPCServerError(error: {
    code: any;
    message: string;
    data: any;
}): void;
export class RPCServerError {
    /**
     * Constructor of error object, that should be thrown if server responded with error
     *
     * @param {{code: int, message: string, data: *?}} error - error data
     *
     * @constructor
     */
    constructor(error: {
        code: any;
        message: string;
        data: any;
    });
    message: string;
    name: string;
    code: any;
    data: any;
    stack: string;
    constructor: typeof RPCServerError;
}
/**
 * Constructor of error object, that should be thrown if response was not received in given time
 * @constructor
 *
 * @param {object} request - failed request object
 */
export function TimeoutError(request: any): void;
export class TimeoutError {
    /**
     * Constructor of error object, that should be thrown if response was not received in given time
     * @constructor
     *
     * @param {object} request - failed request object
     */
    constructor(request: any);
    message: string;
    name: string;
    stack: string;
    constructor: typeof TimeoutError;
}
/**
 * List additional JSON RPC errors
 *
 * @type {object}
 */
export const RPC_ERRORS: object;
/**
 * Wrapper for WebSockets
 */
declare class JsonRPCSocket extends EventEmitter<string | symbol> {
    constructor(socket: any, id: any, options?: {});
    options: {
        generate_request_id: any;
    };
    _pendingRequests: Map<any, any>;
    _id: any;
    _socket: any;
    /**
     * RPC message handler
     * @param {string|Buffer} data - received message
     * @returns {Promise<void>}
     * @private
     */
    _handleRpcMessage(data: string | Buffer): Promise<void>;
    /**
     * Handle incoming notification
     * @param {object} message - received parsed message
     * @returns {void}
     * @private
     */
    _handleIncomingNotification(message: any): void;
    /**
     * Handle incoming request
     * @param {object} message - parsed JSON-RPC request
     * @returns {Promise.<object>} - promise that on fullfilled returns JSON-RPC message
     * @private
     */
    _handleIncomingRequest(message: any): Promise<any>;
    /**
     * Call remote method
     * @param {boolean} isInternal - should internal method be called or public
     * @param {string} method - method name to call
     * @param {object|array} params? - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response (ms)
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    _callMethod(isInternal: boolean, method: string, params: any, waitTime: number, wsOptions: any): Promise<any>;
    /**
     * Handle response from server
     *
     * @param {string|number} id - request ID
     * @param {*} result - result if response successful
     * @param {{code: number, message: string, data: (array|object)}} error - error
     *
     * @returns {void}
     *
     * @private
     */
    _handleRPCResponse({ id, result, error }: string | number): void;
    /**
     * Returns ID of the socket
     *
     * @returns {number|string}
     */
    getId(): string | number;
    /**
     * Returns native websocket object
     *
     * @returns {WebSocket}
     */
    getSocket(): WebSocket;
    /**
     * Close the socket
     * @param {Number} code? - A numeric value indicating the status code
     *                        explaining why the connection is being closed.
     * @param {String} reason? - A human-readable string explaining why the connection is closing.
     * @returns {void}
     */
    close(code: number, reason: string): void;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callMethod(method: string, params: any, waitTime: number, wsOptions: any): Promise<any>;
    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    callInternalMethod(method: string, params: any, waitTime: number, wsOptions: any): Promise<any>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteMethods(): Promise<any>;
    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    listRemoteEvents(): Promise<any>;
    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendNotification(method: string, params: any): Promise<any>;
    /**
     * Sends given internal notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    sendInternalNotification(method: string, params: any): Promise<any>;
    /**
     * Send given data
     *
     * @param {any} data - data to be sent
     * @param {object} options - options for websocket protocol
     * @param {function} cb - callback that will be invoked when data is sent
     *
     * @returns {*}
     */
    send(data: any, options: any, cb: Function): any;
    on(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): JsonRPCSocket;
    addListener(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): JsonRPCSocket;
    once(event: string | symbol, fn: EventEmitter.ListenerFn, context?: any): JsonRPCSocket;
    removeListener(event: string | symbol, fn?: EventEmitter.ListenerFn, context?: any, once?: boolean): JsonRPCSocket;
    off(event: string | symbol, fn?: EventEmitter.ListenerFn, context?: any, once?: boolean): JsonRPCSocket;
    removeAllListeners(event?: string | symbol): JsonRPCSocket;
}
declare namespace JsonRPCSocket {
    export { TimeoutError };
    export { RPCServerError };
    export { RPC_ERRORS };
}
export default JsonRPCSocket;
import EventEmitter from "eventemitter3";
