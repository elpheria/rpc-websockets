import CommonClient from "./lib/client.cjs";
import { IWSClientAdditionalOptions } from "./lib/client/client.types.cjs";
export declare class Client extends CommonClient {
    constructor(address?: string, { autoconnect, reconnect, reconnect_interval, max_reconnects }?: IWSClientAdditionalOptions, generate_request_id?: (method: string, params: object | Array<any>) => number);
}
