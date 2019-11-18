import JsonRPCSocket from "../JsonRpcSocket";
import Namespace from "../Namespace";

interface IServerOptions {
    strict_notifications?: boolean,
    idParam?: string,
    port?: number
}

type TServerNotificationHandler = (params: any, socket: JsonRPCSocket, ns: Namespace) => any;

export {
    IServerOptions,
    TServerNotificationHandler
}