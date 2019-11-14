import CommonClient from "./lib/client";
export declare class Client extends CommonClient {
    constructor(address?: string, { autoconnect, reconnect, reconnect_interval, max_reconnects }?: {
        autoconnect?: boolean;
        reconnect?: boolean;
        reconnect_interval?: number;
        max_reconnects?: number;
    }, generate_request_id?: (method: string, params: object | Array<any>) => number);
}
export { default as Server } from "./lib/server";
