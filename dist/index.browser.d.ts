import CommonClient from "./lib/client";
import { IWSClientAdditionalOptions } from "./lib/client/types";
import { BrowserWebSocketTypeOptions } from "./lib/common.types";
export declare class Client extends CommonClient {
    constructor(address: string, options?: IWSClientAdditionalOptions & BrowserWebSocketTypeOptions, generate_request_id?: (method: string, params: object | Array<any>) => number);
}
