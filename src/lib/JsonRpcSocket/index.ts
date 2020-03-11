// @ts-ignore
import jsonrpc from "json-rpc-msg"
import uuid from "uuid/v1"
import EventEmitter from "eventemitter3"
import CircularJSON from "circular-json"
import {
    IRpcRequest,
    IJsonRpcSocket,
    IJsonRPCSocketOptions,
    TJsonRpcSocketId,
    TRpcRequestId,
    TRpcRequestName,
    IParsedRpcNotification,
    IParsedRpcInternalNotification,
    IParsedRpcRequest,
    IParsedRpcInternalRequest,
    TParsedRpcSimpleMessage,
    IRpcResponder,
    TRpcRequestParams,
    TRpcNotificationName,
    TRpcNotificationParams
} from "./types"
import {TCommonWebSocket} from "../common.types"

/**
 * List additional JSON RPC errors
 *
 * @type {object}
 */
export const RPC_ERRORS = {
    ...jsonrpc.ERRORS,
    INTERNAL_SERVER_ERROR: {
        code: -32000,
        message: "Internal server error"
    }
}

/**
 * Constructor of error object, that should be thrown if server responded with error
 *
 * @param {{code: int, message: string, data: *?}} error - error data
 *
 * @constructor
 */
export class RPCServerError extends Error
{
    public message: string;
    public code: number;
    public data: any;
    public stack: any;

    constructor(error: {message: string, code: number, data?: any})
    {
        super()
        this.message = error.message
        this.code = error.code
        this.data = error.data
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor)
        else
            this.stack = (new Error()).stack
    }
}

/**
 * Constructor of error object, that should be thrown if response was not received in given time
 * @constructor
 *
 * @param {object} request - failed request object
 */
export class TimeoutError extends Error
{
    public code: number;
    public message: string;
    public data: any;
    public stack: any;

    constructor(request: IRpcRequest)
    {
        super()
        this.message = `Request to method "${request.method}" timed out`
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor)
        else
            this.stack = (new Error()).stack
    }
}

interface RpcRequestWrapper {
    timer?: NodeJS.Timeout,
    promise: {
        resolve: (data: any) => void,
        reject: (error: any) => void
    }
}

/**
 * Wrapper for WebSockets
 */
export default class JsonRPCSocket extends EventEmitter implements IJsonRpcSocket
{
    static TimeoutError = TimeoutError;
    static RPCServerError = RPCServerError;
    static RPC_ERRORS = RPC_ERRORS;

    private options: IJsonRPCSocketOptions;
    private _pendingRequests: Map<TRpcRequestId, RpcRequestWrapper>;
    private _id: TJsonRpcSocketId;
    private _socket: TCommonWebSocket;

    constructor(socket: TCommonWebSocket, id: TJsonRpcSocketId, options: IJsonRPCSocketOptions = {})
    {
        super()
        this.options = {
            generate_request_id: options.generate_request_id || (() => uuid())
        }
        this._pendingRequests = new Map()
        this._id = id
        this._socket = socket
        this._socket.on("open", (...args) => this.emit("open", ...args))
        this._socket.on("message", (data: string | Buffer | ArrayBuffer) =>
        {
            this.emit("message", data)
            this._handleRpcMessage(data)
        })
        this._socket.on("close", (code, reason) => this.emit("close", code, reason))
        this._socket.on("error", (...args) => this.emit("error", ...args))
    }

    /**
     * RPC message handler
     * @param {string|Buffer} data - received message
     * @returns {Promise<void>}
     * @private
     */
    async _handleRpcMessage(data: string | Buffer | ArrayBuffer)
    {
        const msg_options = {
            binary: false
        }

        // Convert binary messages to string:
        if (data instanceof Buffer || data instanceof ArrayBuffer)
        {
            msg_options.binary = true
            data = Buffer.from(data).toString()
        }

        // try to parse received JSON string:
        let message
        try
        {
            // Parse circular JSON:
            if (typeof data === "string")
                try
                {
                    data = CircularJSON.parse(data)
                }
                catch (e)
                {
                    throw new jsonrpc.ParserError(jsonrpc.createError(null, RPC_ERRORS.PARSE_ERROR))
                }
            // Parse RPC message:
            message = jsonrpc.parseMessage(data)
        }
        // In case of error - send error to client:
        catch (e)
        {
            // If there was an error in
            const rpcError = e instanceof jsonrpc.ParserError
                ? e.rpcError
                : jsonrpc.createError(null, RPC_ERRORS.INTERNAL_SERVER_ERROR)
            this.send(rpcError, msg_options)

            // If it's some javascipt error - throw it up:
            if (!(e instanceof jsonrpc.ParserError))
                throw e
            return
        }

        // Check which type of message was received:
        switch (message.type)
        {
        case jsonrpc.MESSAGE_TYPES.REQUEST:
        case jsonrpc.MESSAGE_TYPES.INTERNAL_REQUEST: {
            const result = await this._handleIncomingRequest(message)
            this.send(result, msg_options)
            break
        }
        case jsonrpc.MESSAGE_TYPES.NOTIFICATION:
        case jsonrpc.MESSAGE_TYPES.INTERNAL_NOTIFICATION: {
            this._handleIncomingNotification(message)
            break
        }
        case jsonrpc.MESSAGE_TYPES.ERROR:
        case jsonrpc.MESSAGE_TYPES.RESPONSE: {
            this._handleRPCResponse(message.payload)
            break
        }
        case jsonrpc.MESSAGE_TYPES.BATCH: {
            const batch = message.payload
            let results: Array<any> = await Promise.all(batch.map((
                msg: jsonrpc.ParserError | TParsedRpcSimpleMessage
            ) =>
            {
                // If current item of batch is invalid rpc-request - return RPC-response with error:
                if (msg instanceof jsonrpc.ParserError)
                {
                    return msg.rpcError
                }
                // If current item of batch is a notification - do nothing with it:
                if (
                    msg.type === jsonrpc.MESSAGE_TYPES.NOTIFICATION ||
                    msg.type === jsonrpc.MESSAGE_TYPES.INTERNAL_NOTIFICATION
                )
                {
                    this._handleIncomingNotification(msg)
                    return
                }
                // If current item of batch is not a request - do nothing with it:
                else if (
                    msg.type === jsonrpc.MESSAGE_TYPES.REQUEST ||
                    msg.type === jsonrpc.MESSAGE_TYPES.INTERNAL_REQUEST
                )
                {
                    return this._handleIncomingRequest(msg)
                }
                else if (
                    msg.type === jsonrpc.MESSAGE_TYPES.ERROR ||
                    msg.type === jsonrpc.MESSAGE_TYPES.RESPONSE
                )
                {
                    this._handleRPCResponse(msg.payload)
                }
                else
                    throw new Error(`Unknown type of message in batch: "${msg.type}"`)
            }))

            results = results.filter((result) => typeof result !== "undefined")
            this.send(results, msg_options)
            break
        }
        default:
            throw new Error(
                `Unsupported type of message ${message.type}. ` +
                `Supported types: ${Object.values(jsonrpc.MESSAGE_TYPES).join(", ")}`
            )
        }
    }

    /**
     * Handle incoming notification
     * @param {object} message - received parsed message
     * @returns {void}
     * @private
     */
    _handleIncomingNotification(message: IParsedRpcNotification | IParsedRpcInternalNotification)
    {
        let notificationType = null
        if (message.type === jsonrpc.MESSAGE_TYPES.NOTIFICATION)
            notificationType = "rpc:notification"
        else if (message.type === jsonrpc.MESSAGE_TYPES.INTERNAL_NOTIFICATION)
            notificationType = "rpc:internal:notification"
        else
            throw new Error(`Unsupported type of notification: ${message.type}`)

        this.emit(notificationType, message.payload, this)
        this.emit(
            `${notificationType}:${message.payload.method}`,
            message.payload.params,
            this
        )
    }

    /**
     * Handle incoming request
     * @param {object} message - parsed JSON-RPC request
     * @returns {Promise.<object>} - promise that on fullfilled returns JSON-RPC message
     * @private
     */
    async _handleIncomingRequest(message: IParsedRpcRequest | IParsedRpcInternalRequest)
    {
        let eventName = ""
        if (message.type === jsonrpc.MESSAGE_TYPES.REQUEST)
            eventName = "rpc:request"
        else if (message.type === jsonrpc.MESSAGE_TYPES.INTERNAL_REQUEST)
            eventName = "rpc:internal:request"
        else
            throw new Error(`Unsupported type of request: ${message.type}`)

        // Wait for response:
        const waitForResponse = new Promise((resolve) =>
        {
            let isFullfilled = false
            const res: IRpcResponder = {
                isSent() { return isFullfilled },
                send(response: any)
                {
                    resolve({type: "response", data: response})
                    isFullfilled = true
                },
                throw(error: {code: number, message: string}, additionalData?: any)
                {
                    resolve({type: "error", data: {error, additionalData}})
                    isFullfilled = true
                }
            }
            const hasListeners = this.emit(eventName, message.payload, res, this)
            if (!hasListeners)
                res.throw(RPC_ERRORS.METHOD_NOT_FOUND)
        })

        // Parse response results and convert it to RPC message:
        return await waitForResponse.then(
            (result: {type: "error" | "response", data: {error?: string, additionalData?: any}}) =>
            {
                if (result.type === "error")
                {
                    return jsonrpc.createError(
                        message.payload.id,
                        result.data.error,
                        result.data.additionalData
                    )
                }
                else
                {
                    return jsonrpc.createResponse(message.payload.id, result.data)
                }
            },
            () => jsonrpc.createError(
                message.payload.id,
                RPC_ERRORS.INTERNAL_SERVER_ERROR
            )
        )
    }

    /**
     * Call remote method
     * @param {boolean} isInternal - should internal method be called or public
     * @param {string} method - method name to call
     * @param {object|array} params? - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response (ms)
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    async _callMethod(
        isInternal: boolean,
        method: TRpcRequestName,
        params?: TRpcRequestParams,
        waitTime: number = 60000,
        wsOptions?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }
    )
    {
        return new Promise((resolve, reject) =>
        {
            // Generate request id:
            const id = this.options.generate_request_id(method, params)

            // Build temporary request signature to help resolve and reject request and control
            // it's life time:
            const request: RpcRequestWrapper = {
                timer: isFinite(waitTime)
                    ? setTimeout(
                        () => request.promise.reject(new TimeoutError({method, params}))
                        , waitTime
                    )
                    : null,
                promise: {
                    resolve: (data) =>
                    {
                        resolve(data)
                        this._pendingRequests.delete(id)
                    },
                    reject: (err) =>
                    {
                        reject(err)
                        this._pendingRequests.delete(id)
                    }
                }
            }

            // Send request:
            const requestObj = isInternal
                ? jsonrpc.createInternalRequest(id, method, params)
                : jsonrpc.createRequest(id, method, params)

            this.send(requestObj, wsOptions, (error: Error) =>
            {
                if (error)
                    return request.promise.reject(error)

                // Store request in "pending requests" registry:
                this._pendingRequests.set(id, request)
            })
        })
    }

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
    _handleRPCResponse(
        responseData: {
            id: TRpcRequestId,
            result?: any,
            error?: {code: number, message: string, data?: any}
        }
    )
    {
        const {id, result, error} = responseData
        const pendingRequest = this._pendingRequests.get(id)
        if (!pendingRequest) return
        if (error)
            pendingRequest.promise.reject(new RPCServerError(error))
        else
            pendingRequest.promise.resolve(result)
    }

    /**
     * Returns ID of the socket
     *
     * @returns {number|string}
     */
    getId()
    {
        return this._id
    }

    /**
     * Returns native websocket object
     *
     * @returns {WebSocket}
     */
    getSocket()
    {
        return this._socket
    }

    /**
     * Close the socket
     * @param {Number} code? - A numeric value indicating the status code
     *                        explaining why the connection is being closed.
     * @param {String} reason? - A human-readable string explaining why the connection is closing.
     * @returns {void}
     */
    close(code = 1000, reason?: string)
    {
        this._socket.close(code, reason)
    }

    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    async callMethod(
        method: TRpcRequestName,
        params?: TRpcRequestParams,
        waitTime?: number,
        wsOptions?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean })
    {
        return this._callMethod(false, method, params, waitTime, wsOptions)
    }

    /**
     * Call remote method
     * @param {string} method - method name to call
     * @param {object|array} params - parameters to pass in method
     * @param {number} waitTime? - max time to wait for response
     * @param {object} wsOptions? - websocket options
     * @returns {Promise<*>}
     */
    async callInternalMethod(
        method: TRpcRequestName,
        params?: TRpcRequestParams,
        waitTime?: number,
        wsOptions?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }
    )
    {
        return this._callMethod(true, method, params, waitTime, wsOptions)
    }

    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    async listRemoteMethods()
    {
        return this.callInternalMethod("listMethods") as Promise<Array<string>>
    }

    /**
     * Retrieve list of remote methods
     *
     * @returns {Promise<array<string>>}
     */
    async listRemoteEvents(): Promise<Array<string>>
    {
        return this.callInternalMethod("listEvents") as Promise<Array<string>>
    }

    /**
     * Sends given notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    async sendNotification(
        method: TRpcNotificationName,
        params: TRpcNotificationParams
    ): Promise<void>
    {
        const notificationObject = jsonrpc.createNotification(method, params)
        return new Promise((resolve, reject) =>
        {
            this.send(notificationObject, (error) =>
            {
                if (error)
                    reject(error)
                resolve()
            })
        })
    }

    /**
     * Sends given internal notification
     *
     * @param {string} method - notification name
     * @param {object|array} params - notification parameters
     *
     * @returns {Promise}
     */
    async sendInternalNotification(
        method: TRpcNotificationName,
        params: TRpcNotificationParams
    ): Promise<void>
    {
        const notificationObject = jsonrpc.createInternalNotification(method, params)
        return new Promise((resolve, reject) =>
        {
            this.send(notificationObject, (error) =>
            {
                if (error)
                    reject(error)
                resolve()
            })
        })
    }

    /**
     * Send given data
     *
     * @param {any} data - data to be sent
     * @param {object} options - options for websocket protocol
     * @param {function} cb - callback that will be invoked when data is sent
     *
     * @returns {*}
     */
    send(
        data: any,
        options?: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean } |
            ((err?: Error) => void),
        cb?: (err?: Error) => void
    )
    {
        if (
            data &&
            typeof data === "object" &&
            !(data instanceof ArrayBuffer) &&
            !(data instanceof Buffer)
        )
        {
            data = CircularJSON.stringify(data)
        }
        if (!cb)
        {
            cb = function() {}
        }
        // @ts-ignore
        return this._socket.send(data, options, cb)
    }
}
