export interface IWSClientAdditionalOptions {
    address?: string;
    autoconnect?: boolean;
    reconnect?: boolean;
    reconnect_interval?: number;
    max_reconnects?: number;
    strict_subscriptions?: boolean;
    generate_request_id?: (method: string, params: object | Array<any>) => number
}
