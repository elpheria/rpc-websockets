import EventEmitter from "eventemitter3"
import {
    IJsonRpcSocket, TRpcNotificationHandler,
    TRpcNotificationName, TRpcNotificationParams, TRpcRequestHandler, TRpcRequestName
} from "../JsonRpcSocket/types"

interface INamespace extends EventEmitter {
    // TODO: add all namespace methods and it's signatures
    addClient(socket: IJsonRpcSocket): INamespace
    registerNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void
    unregisterNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void
    getRegisteredNotifications(): Array<TRpcNotificationName>
    onNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    onceNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    offNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    sendNotification(
        name: TRpcNotificationName,
        params?: TRpcNotificationParams
    ): Promise<unknown>
    registerInternalNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void
    unregisterInternalNotification(names: TRpcNotificationName | Array<TRpcNotificationName>): void
    getRegisteredInternalNotifications(): Array<TRpcNotificationName>
    onInternalNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    onceInternalNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    offInternalNotification(
        name: TRpcNotificationName | {[key: string]: TRpcNotificationHandler},
        handler?: TRpcNotificationHandler
    ): void
    sendInternalNotification(
        name: TRpcNotificationName,
        params?: TRpcNotificationParams
    ): Promise<unknown>
    registerMethod(name: TRpcRequestName, fn: TRpcRequestHandler): void
    unregisterMethod(name: TRpcRequestName): void
    getRegisteredMethodsNames(): Array<TRpcRequestName>
    registerInternalMethod(name: TRpcRequestName, fn: TRpcRequestHandler): void
    unregisterInternalMethod(name: TRpcRequestName): void
    getRegisteredInternalMethodsNames(): Array<TRpcRequestName>
}

type TNamespaceName = string
interface INamespaceOptions {
    strict_notifications: boolean
}

interface INotificationsSubscriptionsResult {
    [key: string]: "ok" | "provided event invalid"
}

export {
    INamespace,
    TNamespaceName,
    INamespaceOptions,
    INotificationsSubscriptionsResult
}
