import CommonClient from "./lib/client";
import { IWSClientAdditionalOptions } from "./lib/client/types";
import { NodeWebSocketTypeOptions } from "./lib/common.types";
export declare class Client extends CommonClient {
    constructor(address: string, options?: IWSClientAdditionalOptions & NodeWebSocketTypeOptions, generate_request_id?: (method: string, params: object | Array<any>) => number);
}
export { default as Server } from "./lib/server";
