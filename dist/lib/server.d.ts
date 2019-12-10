/**
 * "Server" wraps the "ws" library providing JSON RPC 2.0 support on top.
 * @module Server
 */
import { EventEmitter } from "eventemitter3";
import NodeWebSocket, { Server as WebSocketServer } from "ws";
interface INamespaceEvent {
    [x: string]: Array<string>;
}
interface IRPCMethodParams {
    [x: string]: any;
}
interface IRPCMethod {
    [x: string]: {
        fn: (params: IRPCMethodParams) => any;
        protected: boolean;
    };
}
interface IWebSocketWithId extends NodeWebSocket {
    _id: string;
}
export default class Server extends EventEmitter {
    private namespaces;
    private authenticated;
    wss: InstanceType<typeof WebSocketServer>;
    /**
     * Instantiate a Server class.
     * @constructor
     * @param {Object} options - ws constructor's parameters with rpc
     * @return {Server} - returns a new Server instance
     */
    constructor(options: NodeWebSocket.ServerOptions);
    /**
     * Registers an RPC method.
     * @method
     * @param {String} name - method name
     * @param {Function} fn - a callee function
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Object} - returns the RPCMethod object
     */
    register(name: string, fn: (params: IRPCMethodParams) => void, ns?: string): {
        protected: () => void;
        public: () => void;
    };
    /**
     * Sets an auth method.
     * @method
     * @param {Function} fn - an arbitrary auth method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    setAuth(fn: (params: IRPCMethodParams) => boolean, ns?: string): void;
    /**
     * Marks an RPC method as protected.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */
    private _makeProtected;
    /**
     * Marks an RPC method as public.
     * @method
     * @param {String} name - method name
     * @param {String} ns - namespace identifier
     * @return {Undefined}
     */
    private _makePublic;
    /**
     * Removes a namespace and closes all connections
     * @method
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    closeNamespace(ns: string): void;
    /**
     * Creates a new event that can be emitted to clients.
     * @method
     * @param {String} name - event name
     * @param {String} ns - namespace identifier
     * @throws {TypeError}
     * @return {Undefined}
     */
    event(name: string, ns?: string): void;
    /**
     * Returns a requested namespace object
     * @method
     * @param {String} name - namespace identifier
     * @throws {TypeError}
     * @return {Object} - namespace object
     */
    of(name: string): {
        register(fn_name: string, fn: (params: IRPCMethodParams) => void): {
            protected: () => void;
            public: () => void;
        };
        event(ev_name: string): void;
        readonly eventList: string[];
        /**
         * Emits a specified event to this namespace.
         * @inner
         * @method
         * @param {String} event - event name
         * @param {Array} params - event parameters
         * @return {Undefined}
         */
        emit(event: string, ...params: string[]): void;
        /**
         * Returns a name of this namespace.
         * @inner
         * @method
         * @kind constant
         * @return {String}
         */
        readonly name: string;
        /**
         * Returns a hash of websocket objects connected to this namespace.
         * @inner
         * @method
         * @return {Object}
         */
        connected(): {};
        /**
         * Returns a list of client unique identifiers connected to this namespace.
         * @inner
         * @method
         * @return {Array}
         */
        clients(): {
            rpc_methods: IRPCMethod;
            clients: Map<string, IWebSocketWithId>;
            events: INamespaceEvent;
        };
    };
    /**
     * Lists all created events in a given namespace. Defaults to "/".
     * @method
     * @param {String} ns - namespaces identifier
     * @readonly
     * @return {Array} - returns a list of created events
     */
    eventList(ns?: string): string[];
    /**
     * Creates a JSON-RPC 2.0 compliant error
     * @method
     * @param {Number} code - indicates the error type that occurred
     * @param {String} message - provides a short description of the error
     * @param {String|Object} data - details containing additional information about the error
     * @return {Object}
     */
    createError(code: number, message: string, data: string | object): {
        code: number;
        message: string;
        data: string | object;
    };
    /**
     * Closes the server and terminates all clients.
     * @method
     * @return {Promise}
     */
    close(): Promise<unknown>;
    /**
     * Handles all WebSocket JSON RPC 2.0 requests.
     * @private
     * @param {Object} socket - ws socket instance
     * @param {String} ns - namespaces identifier
     * @return {Undefined}
     */
    private _handleRPC;
    /**
     * Runs a defined RPC method.
     * @private
     * @param {Object} message - a message received
     * @param {Object} socket_id - user's socket id
     * @param {String} ns - namespaces identifier
     * @return {Object|undefined}
     */
    private _runMethod;
    /**
     * Generate a new namespace store.
     * Also preregister some special namespace methods.
     * @private
     * @param {String} name - namespaces identifier
     * @return {undefined}
     */
    private _generateNamespace;
}
export {};
