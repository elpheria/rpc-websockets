import WebSocket from "ws";
import { IWSClientAdditionalOptions } from "./client.types";
export default function (address: string, options: IWSClientAdditionalOptions & WebSocket.ClientOptions): WebSocket;
