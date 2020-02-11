# API Documentation

This is a JavaScript classes documentation which describes both client and server instance creation and management.

#### Table of Contents
* [Client](#client)
    * [Constructor](#new-websocketaddress-options---client)
    * [connect](#wsconnect)
    * [registerMethod](#wsregistermethod-name-handler)
    * [registerInternalMethod](#wsregisterinternalmethod-name-handler)
    * [unregisterMethod](#wsunregistermethod-name)
    * [unregisterInternalMethod](#wsunregisterinternalmethod-name)
    * [getRegisteredMethodsNames](#wsgetregisteredmethodsnames---array)
    * [getRegisteredInternalMethodsNames](#wsgetregisteredinternalmethodsnames---array)
    * [~~call~~](#wscallmethod-params-timeout-ws_options---promise)
    * [callMethod](#wscallmethodmethod-params-timeout-ws_options---promise)
    * [callInternalMethod](#wscallinternalmethodmethod-params-timeout-ws_options---promise)
    * [~~listMethods~~](#wslistmethods---promise)
    * [listRemoteMethods](#wslistremotemethods---promise)
    * [listRemoteEvents](#wslistremoteevents---promise)
    * [~~notify~~](#wsnotifymethod-params)
    * [sendNotification](#wssendnotificationmethod-params)
    * [sendInternalNotification](#wssendinternalnotificationmethod-params)
    * [registerNotification](#wsregisternotification-names)
    * [registerInternalNotification](#wsregisterinternalnotification-names)
    * [unregisterNotification](#wsunregisternotification-names)
    * [unregisterInternalNotification](#wsunregisterinternalnotification-names)
    * [getRegisteredNotifications](#wsgetregisterednotifications---array)
    * [getRegisteredInternalNotifications](#wsgetregisteredinternalnotifications---array)
    * [onNotification](#wsonnotificationname-handler)
    * [onInternalNotification](#wsoninternalnotificationname-handler)
    * [onceNotification](#wsoncenotificationname-handler)
    * [onceInternalNotification](#wsonceinternalnotificationname-handler)
    * [offNotification](#wsoffnotificationname-handler)
    * [offInternalNotification](#wsoffinternalnotificationname-handler)
    * [subscribe](#wssubscribeevent---promise)
    * [unsubscribe](#wsunsubscribeevent---promise)
    * [close](#wsclosecode-data)
    * [getRPCSocket](#servergetrpcsocketid---jsonrpcsocket--undefined)
    * [event:open](#event-open)
    * [event:error](#event-error)
    * [event:close](#event-close)
    * [event:RPCConnection](#event-rpcconnection)
* [Server](#server)
    * [Constructor](#new-websocketserveroptions---server)
    * [~~register~~](#serverregistermethod-handler-namespace)
    * [registerMethod](#serverregistermethodname-handler-ns--)
    * [registerInternalMethod](#serverregisterinternalmethodname-handler-ns--)
    * [unregisterMethod](#serverunregistermethodname-ns--)
    * [unregisterInternalMethod](#serverunregisterinternalmethodname-ns--)
    * [getRegisteredMethodsNames](#servergetregisteredmethodsnamesns-----array)
    * [getRegisteredInternalMethodsNames](#servergetregisteredinternalmethodsnamesns-----array)
    * [~~event~~](#servereventname-namespace)
    * [registerNotification](#serverregisternotificationname-ns--)
    * [registerInternalNotification](#serverregisterinternalnotificationname-ns--)
    * [unregisterNotification](#serverunregisternotificationname-ns--)
    * [unregisterInternalNotification](#serverunregisterinternalnotificationname-ns--)
    * [getRegisteredNotifications](#servergetregisterednotifications-ns-----array)
    * [getRegisteredInternalNotifications](#servergetregisteredinternalnotifications-ns-----array)
    * [sendNotification](#serversendnotificationname-params)
    * [sendInternalNotification](#serversendinternalnotificationname-params)
    * [onNotification](#serveronnotificationname-handler)
    * [onInternalNotification](#serveroninternalnotificationname-handler)
    * [onceNotification](#serveroncenotificationname-handler)
    * [onceInternalNotification](#serveronceinternalnotificationname-handler)
    * [offNotification](#serveroffnotificationname-handler)
    * [offInternalNotification](#serveroffinternalnotificationname-handler)
    * [~~eventList~~](#servereventlistnamespace---array)
    * [of](#serverofname---namespace)
    * [createError](#servercreateerrorcode-message-data---object)
    * [createNamespace](#servercreatenamespacename---namespace)
    * [hasNamespace](#serverhasnamespacename---namespace)
    * [getNamespace](#servergetnamespacename---namespace--undefined)
    * [getOrCreateNamespace](#servergetorcreatenamespacename---namespace)
    * [closeNamespace](#serverclosenamespacens---promise)
    * [close](#serverclose---promise)
    * [event:listening](#event-listening)
    * [event:connection](#event-connection)
    * [event:error](#event-error-1)
* [Namespace](#namespace)
    * [~~register~~](#namespaceregistermethod-handler)
    * [~~event~~](#namespaceeventname)
    * [name](#get-namespacename---string)
    * [~~connected~~](#namespaceconnected---object)
    * [~~eventList~~](#namespaceeventlist---array)
    * [~~clients~~](#namespaceclients---array)
    * [registerNotification](#namespaceregisternotificationname)
    * [registerInternalNotification](#namespaceregisterinternalnotificationname)
    * [unregisterNotification](#namespaceunregisternotificationname)
    * [unregisterInternalNotification](#namespaceunregisterinternalnotificationname)
    * [getRegisteredNotifications](#namespacegetregisterednotifications---array)
    * [getRegisteredInternalNotifications](#namespacegetregisteredinternalnotifications---array)
    * [sendNotification](#namespacesendnotificationname-params)
    * [sendInternalNotification](#namespacesendinternalnotificationname-params)
    * [onNotification](#namespaceonnotificationname-handler)
    * [onInternalNotification](#namespaceoninternalnotificationname-handler)
    * [onceNotification](#namespaceoncenotificationname-handler)
    * [onceInternalNotification](#namespaceonceinternalnotificationname-handler)
    * [offNotification](#namespaceoffnotificationname-handler)
    * [offInternalNotification](#namespaceoffinternalnotificationname-handler)
    * [registerMethod](#namespaceregistermethod-handler)
    * [registerInternalMethod](#namespaceregisterinternalmethodname-handler)
    * [unregisterMethod](#namespaceunregistermethodname)
    * [unregisterInternalMethod](#namespaceunregisterinternalmethodname-handler)
    * [getRegisteredMethodsNames](#namespacegetregisteredmethodsnames---array)
    * [getRegisteredInternalMethodsNames](#namespacegetregisteredinternalmethodsnames---array)
    * [getClients](#namespacegetclientid---jsonrpcsocket--null)
    * [getClient](#namespacegetclients--arrayjsonrpcsocket)
    * [close](#namespaceclose)
* [JSONRpcSocket](#jsonrpcsocket)
    * [getId](#socketgetid---string--number)
    * [getSocket](#socketgetsocket---websocket)
    * [close](#socketclosecode-data)
    * [callMethod](#socketcallmethodmethod-params-timeout-ws_options---promise)
    * [callInternalMethod](#socketcallinternalmethodmethod-params-timeout-ws_options---promise)
    * [listRemoteMethods](#socketlistremotemethods---promise)
    * [listRemoteEvents](#socketlistremoteevents---promise)
    * [sendNotification](#socketsendnotificationmethod-params)
    * [sendInternalNotification](#socketsendinternalnotificationmethod-params)

## Migrating to 3.x/4.x

Departing from version 2.x, there's been some minor API changes. A breaking change is a server.eventList method, which is not a getter method anymore, because of the inclusion of a namespaces system throughout the library. Other methods will work seamlessly.

## Client

```js
var WebSocket = require('rpc-websockets').Client
var ws = new WebSocket('ws://localhost:8080')
```

### new WebSocket(address[, options]) -> Client

Instantiate a WebSocket client.

Parameters:
* `address` {String}: The URL of the WebSocket server. The URL path portion resolves to a server namespace. If the URL query key `socket_id` exists, it will be used as a socket identifier. Defaults to 'ws://localhost:8080'.
* `options` {Object}: Client options that are also forwarded to `ws`.
  * `autoconnect` {Boolean}: Client autoconnect upon Client class instantiation. Defaults to `true`.
  * `reconnect` {Boolean}: Whether client should reconnect automatically once the connection is down. Defaults to `true`.
  * `reconnect_interval` {Number}: Time between adjacent reconnects. Defaults to `1000`.
  * `max_reconnects` {Number}: Maximum number of times the client should try to reconnect. Defaults to `5`. `0` means unlimited.
  * `strict_subscriptions` {Boolean}: should special request to server be send to confirm client's subscription to some event(s). Defaults to ```true```.
* `generate_request_id` {Function} Custom function to generate request id instead of simple increment by default. Passes `method` and `params` to parameters.

### ws.connect() -> Promise

Connects to a previously defined server if not connected already. Returns promise which resolves once connection was opened. Should only be used in case `autoconnect` was disabled.

### ws.registerMethod(name, handler)

For more information see [registerMethod](#namespaceregistermethod-handler) of [Namespace](#namespace)

### ws.registerInternalMethod(name, handler)

For more information see [registerInternalMethod](#namespaceregisterinternalmethodname-handler) of [Namespace](#namespace)

### ws.unregisterMethod(name)

For more information see [unregisterMethod](#namespaceunregistermethodname) of [Namespace](#namespace)

### ws.unregisterInternalMethod(name)

For more information see [unregisterInternalMethod](#namespaceunregisterinternalmethodname-handler) of [Namespace](#namespace)

### ws.getRegisteredMethodsNames() -> Array

For more information see [getRegisteredMethodsNames](#namespacegetregisteredmethodsnames---array) of [Namespace](#namespace)

### ws.getRegisteredInternalMethodsNames() -> Array

For more information see [getRegisteredInternalMethodsNames](#namespacegetregisteredinternalmethodsnames---array) of [Namespace](#namespace)

### ~~ws.call(method[, params[, timeout[, ws_options]]]) -> Promise~~

**DEPRECATED, use [callMethod](#wscallmethodmethod-params-timeout-ws_options---promise) or [callInternalMethod](#wscallinternalmethodmethod-params-timeout-ws_options---promise) instead**

Calls a registered RPC method on server. Resolves once the response is ready. Throws if an RPC error was received.

Parameters:
* `method` {String}: An RPC method name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the request.
* `timeout` {Number}: Optional RPC reply timeout in milliseconds.
* `ws_options` {Object}: Optional parameters passed to ws. Not available on web browsers.
  * `compress` {Boolean}: Specifies whether data should be compressed or not. Defaults to true when permessage-deflate is enabled.
  * `binary` {Boolean}: Specifies whether data should be sent as a binary or not. Default is autodetected.
  * `mask` {Boolean} Specifies whether data should be masked or not. Defaults to true when websocket is not a server client.
  * `fin` {Boolean} Specifies whether data is the last fragment of a message or not. Defaults to true.

### ws.callMethod(method[, params[, timeout[, ws_options]]]) -> Promise

For more infomation see [callMethod](#socketcallmethodmethod-params-timeout-ws_options---promise) of [JSONRpcSocket](#jsonrpcsocket)

### ws.callInternalMethod(method[, params[, timeout[, ws_options]]]) -> Promise

For more infomation see [callInternalMethod](#socketcallinternalmethodmethod-params-timeout-ws_options---promise) of [JSONRpcSocket](#jsonrpcsocket)
 
### ~~ws.listMethods() -> Promise~~

**DEPRECATED, use [listRemoteMethods](#wslistremotemethods---promise) instead**

Fetches a list of client's methods registered on server.

### ws.listRemoteMethods() -> Promise

For more infomation see [listRemoteMethods](#socketlistremotemethods---promise) of [JSONRpcSocket](#jsonrpcsocket)

### ws.listRemoteEvents() -> Promise

For more infomation see [listRemoteEvents](#socketlistremoteevents---promise) of [JSONRpcSocket](#jsonrpcsocket)

### ~~ws.notify(method[, params])~~

**DEPRECATED, use [sendNotification](#wssendnotificationmethod-params) or [sendInternalNotification](#wssendinternalnotificationmethod-params) instead**

Sends a JSON-RPC 2.0 notification to server.

Parameters:
* `method` {String}: An RPC method name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the request.


### ws.sendNotification(method[, params])

For more information see [sendNotification](#namespacesendnotificationname-params) of [Namespace](#namespace)

### ws.sendInternalNotification(method[, params])

For more information see [sendInternalNotification](#namespacesendinternalnotificationname-params) of [Namespace](#namespace)

### ws.registerNotification(name)

For more information see [registerNotification](#namespaceregisternotificationname) of [Namespace](#namespace)

### ws.registerInternalNotification(name)

For more information see [registerInternalNotification](#namespaceregisterinternalnotificationname) of [Namespace](#namespace)

### ws.unregisterNotification(name)

For more information see [unregisterNotification](#namespaceunregisternotificationname) of [Namespace](#namespace)

### ws.unregisterInternalNotification(name)

For more information see [unregisterInternalNotification](#namespaceunregisterinternalnotificationname) of [Namespace](#namespace)

### ws.getRegisteredNotifications() -> Array

For more information see [getRegisteredNotifications](#namespacegetregisterednotifications---array) of [Namespace](#namespace)

### ws.getRegisteredInternalNotifications() -> Array

For more information see [getRegisteredInternalNotifications](#namespacegetregisteredinternalnotifications---array) of [Namespace](#namespace)

### ws.onNotification(name[, handler])

For more information see [onNotification](#namespaceonnotificationname-handler) of [Namespace](#namespace)

### ws.onInternalNotification(name[, handler])

For more information see [onInternalNotification](#namespaceoninternalnotificationname-handler) of [Namespace](#namespace)

### ws.onceNotification(name[, handler])

For more information see [onceNotification](#namespaceoncenotificationname-handler) of [Namespace](#namespace)

### ws.onceInternalNotification(name[, handler])

For more information see [onceInternalNotification](#namespaceonceinternalnotificationname-handler) of [Namespace](#namespace)

### ws.offNotification(name[, handler])

For more information see [offNotification](#namespaceoffnotificationname-handler) of [Namespace](#namespace)

### ws.offInternalNotification(name[, handler])

For more information see [offInternalNotification](#namespaceoffinternalnotificationname-handler) of [Namespace](#namespace)

### ws.subscribe(event) -> Promise

Subscribes for a defined event(s).
On fulfilled returns object with event names as keys and
subscription status in values ("ok" of successfully subscribed, or string with error
information if subscription failed)
 
Parameters:
* `event` {String|Array}: Event name.

### ws.unsubscribe(event) -> Promise

Unsubscribes from a defined event(s).
On fulfilled returns object with event names as keys and
subscription status in values ("ok" of successfully unsubscribed, or string with error
information if unsubscription failed)
 
Parameters:
* `event` {String|Array}: Event name.


### ws.close([code[, data]])

For more information see [close](#socketclosecode-data) of [JSONRpcSocket](#jsonrpcsocket)

### Event: 'open'

Emits when the connection is opened and ready for use.

### Event: 'error'

* &lt;Error&gt;

Emits when a socket error is raised.

### Event: 'close'

Emits when the connection is closed.

## Server

```js
var WebSocketServer = require('rpc-websockets').Server

var server = new WebSocketServer({
  port: 8080,
  host: 'localhost'
})
```

### new WebSocketServer([options]) -> Server

Instantiate a WebSocket server.

Parameters:
* `options` {Object}: Server options that are also forwarded to `ws`.
  * `port` {Number}: Port number on which the server will listen for incoming requests.
  * `host` {String}: Address on which the server will listen for incoming requests.
  * `strict_notifications` {Boolean}: Should server send events to only those clients that previously subscribed to this events. Defaults to ```true```
  * `idParam` {String}: name of the parameter in request which is used to determine connected socket ID. Defaults to ```"socket_id"```

Once the Server class is instantiated, you can use a `ws` library's instance via server.wss object.

### ~~server.register(method, handler[, namespace])~~

**DEPRECATED, use [server.registerMethod](#serverregistermethodname-handler-ns--) or [server.registerInternalMethod](#serverregisterinternalmethodname-handler-ns--) instead**

Registers an RPC method and returns the RPCMethod object to manage method permissions.

Parameters:
* `method` {String}: RPC method name.
* `handler` {Function}: RPC function that will be fired with a possible parameter object once the method is called.
* `namespace` {String}: Namespace identifier. Defaults to ```/```.

### server.registerMethod(name, handler[, ns = "/"])

Registers a method on given namespace.

For more information see [registerMethod](#namespaceregistermethodname-handler) of [Namespace](#namespace)

### server.registerInternalMethod(name, handler[, ns = "/"])

Registers an internal method on given namespace.

For more information see [registerInternalMethod](#namespaceregisterinternalmethodname-handler) of [Namespace](#namespace)

### server.unregisterMethod(name[, ns = "/"])

Unregisters a method on given namespace.

For more information see [unregisterMethod](#namespaceunregistermethodname) of [Namespace](#namespace)

### server.unregisterInternalMethod(name[, ns = "/"])

Unregisters an internal method on given namespace.

For more information see [unregisterInternalMethod](#namespaceunregisterinternalmethodname-handler) of [Namespace](#namespace)

### server.getRegisteredMethodsNames([ns = "/"]) -> Array

Returns list of registered methods on given namespace

For more information see [getRegisteredMethodsNames](#namespacegetregisteredmethodsnames---array) of [Namespace](#namespace)

### server.getRegisteredInternalMethodsNames([ns = "/"]) -> Array

Returns list of registered internal methods on given namespace

For more information see [getRegisteredInternalMethodsNames](#namespacegetregisteredinternalmethodsnames---array) of [Namespace](#namespace)

### ~~server.event(name[, namespace])~~

**DEPRECATED, use [server.registerNotification](#serverregisternotificationname-ns--) or [server.registerInternalNotification](#serverregisterinternalnotificationname-ns--l) instead**

Creates a new event that can be emitted to clients.

Parameters:
* `name` {String}: Name of the event.
* `namespace` {String}: Namespace identifier. Defaults to ```/```.

### server.registerNotification(name[, ns = "/"])

Registers given notification on given namespace

For more information see [registerNotification](#namespaceregisternotificationname) of [Namespace](#namespace)

### server.registerInternalNotification(name[, ns = "/"])

Registers given internal notification on given namespace

For more information see [registerInternalNotification](#namespaceregisterinternalnotificationname) of [Namespace](#namespace)

### server.unregisterNotification(name[, ns = "/"])

Unregisters given notification on given namespace

For more information see [unregisterNotification](#namespaceunregisternotificationname) of [Namespace](#namespace)

### server.unregisterInternalNotification(name[, ns = "/"])

Unregisters given internal notification on given namespace

For more information see [unregisterInternalNotification](#namespaceunregisterinternalnotificationname) of [Namespace](#namespace)

### server.getRegisteredNotifications([, ns = "/"]) -> Array

Returns list of notifications names registered on given namespace

For more information see [getRegisteredNotifications](#namespacegetregisterednotifications---array) of [Namespace](#namespace)

### server.getRegisteredInternalNotifications([, ns = "/"]) -> Array

Returns list of internal notifications names registered on given namespace

For more information see [getRegisteredInternalNotifications](#namespacegetregisteredinternalnotifications---array) of [Namespace](#namespace)

### server.sendNotification(name[, params])

For more information see [sendNotification](#namespacesendnotificationname-params) of [Namespace](#namespace)

### server.sendInternalNotification(name[, params])

For more information see [sendInternalNotification](#namespacesendinternalnotificationname-params) of [Namespace](#namespace)

### server.onNotification(name[, handler])

For more information see [onNotification](#namespaceonnotificationname-handler) of [Namespace](#namespace)

### server.onInternalNotification(name[, handler])

For more information see [onInternalNotification](#namespaceoninternalnotificationname-handler) of [Namespace](#namespace)

### server.onceNotification(name[, handler])

For more information see [onceNotification](#namespaceoncenotificationname-handler) of [Namespace](#namespace)

### server.onceInternalNotification(name[, handler])

For more information see [onceInternalNotification](#namespaceonceinternalnotificationname-handler) of [Namespace](#namespace)

### server.offNotification(name[, handler])

For more information see [offNotification](#namespaceoffnotificationname-handler) of [Namespace](#namespace)

### server.offInternalNotification(name[, handler])

For more information see [offInternalNotification](#namespaceoffinternalnotificationname-handler) of [Namespace](#namespace)

### ~~server.eventList([namespace]) -> Array~~

**DEPRECATED, use [server.getRegisteredNotifications](#servergetregisterednotifications-ns-----array) or [server.getRegisteredInternalNotifications](#servergetregisteredinternalnotifications-ns-----array)**

Lists all created events.

Parameters:
* `namespace`: Namespace identifier. Defaults to ```/```.

### server.of(name) -> Namespace

Returns a Namespace object initialized by the provided pathname upon connecting (eg: ```/chat```).
Defaults to ```/```.

Parameters:
* `name` {String}: Namespace identifier.

More information on Namespaces below.

### server.createError(code, message[, data]) -> Object

Creates a structured error that can be thrown in a .register callback.

Parameters:
* `code` {Number}: Indicates the error type that occurred.
* `message` {String}: Provides a short description of the error.
* `data` {String|Object}: Details containing additional information about the error.

### server.createNamespace(name) -> Namespace

Creates new namespace on the server

Parameters:
* `name` {String}: name of namespace

### server.hasNamespace(name) -> Boolean

Checks whether server has a namespace with given name

Parameters:
* `name` {String}: name of namespace

### server.getNamespace(name) -> Namespace | undefined

Returns a namespace with given name

Parameters:
* `name` {String}: name of namespace

### server.getOrCreateNamespace(name) -> Namespace

Helper function that returns existing or creates new namespace with given name

Parameters:
* `name` {String}: name of namespace

### server.closeNamespace(ns)

Closes the given namespace and terminates all its clients.

### server.close() -> Promise

Closes the server and terminates all clients.

### server.getRPCSocket(id) -> JSONRpcSocket | undefined

Returns instance of JSONRpcSocket with given ID or undefined if no socket found

Parameters
* `id` {String|Number}: socket ID

### Event: 'listening'

Emits when the server has started listening for requests.

### Event: 'connection'

* `socket` &lt;ws.WebSocket&gt;
* `request` &lt;http.IncomingMessage&gt;

Emits when the client has connected.

### Event: 'error'

* &lt;Error&gt;

Emits when a server error is raised.

### Event: 'RPCConnection'

* `socket` &lt;JSONRpcSocket&gt;
* `request` &lt;http.IncomingMessage&gt;

Emits when the client has connected and RPC connection is initialized.

## Namespace
Namespace represents a pool of sockets connected under a given scope identified by a pathname (eg: ```/chat```). Basically borrows ideas from ```socket.io```.

### ~~namespace.register(method, handler)~~

**DEPRECATED, use [registerMethod](#namespaceregistermethodname-handler) or [registerInternalMethod](#namespaceregisterinternalmethodname-handler) of [Namespace](#namespace)**

A convenience method for server.register using this namespace.

### ~~namespace.event(name)~~

**DEPRECATED, use [registerNotification](#namespaceregisternotificationname) or [registerInternalNotification](#namespaceregisterinternalnotificationname) of [Namespace](#namespace)

A convenience method for server.event using this namespace.

### **get** namespace.name -> String

Returns a namespace identifier.

### ~~namespace.connected() -> Object~~

**DEPRECATED**

Returns a hash of websocket objects connected to this namespace, identified by ```id```.

### ~~namespace.eventList -> Array~~

**DEPRECATED, use [getRegisteredNotifications](#namespacegetregisterednotifications---array) of [Namespace](#namespace) instead.

A convenience method that lists all created events in this namespace.

### ~~namespace.clients() -> Array~~

**DEPRECATED, use [getClients](#namespacegetclients---arrayjsonrpcsocket) of [Namespace](#namespace) instead**

Returns a list of client unique identifiers connected to this namespace.

### namespace.registerNotification(name)

Registers a notification that can be send to clients.

Parameters:
* `name` {String}: name of notification

### namespace.registerInternalNotification(name)

Registers an internal notification that can be send to clients.
The only difference between this method and [registerNotification](#namespaceregisternotificationname) is that this method
allows to register notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String}: name of notification

```javascript
// "rpc.on" notification will be registered in both cases:
namespace.registerInternalNotification('rpc.on');
namespace.registerInternalNotification('on');

// And this will throw an error:
namespace.registerNotification('rpc.on')
```

### namespace.unregisterNotification(name)

Unregisters given notification.

Parameters:
* `name` {String}: name of notification

### namespace.unregisterInternalNotification(name)

Unregisters given internal notification.
The only difference between this method and [unregisterNotification](#namespaceunregisterinternalnotificationname) is that this method
allows to unregister notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String}: name of notification

### namespace.getRegisteredNotifications() -> Array

Returns list of registered notifications names (not including internal notifications)

### namespace.getRegisteredInternalNotifications() -> Array

Returns list of registered internal notifications names

### namespace.sendNotification(name[, params])

Sends a notification with given name and parameters to subscribed clients

Parameters:
* `name` {String}: name of notification
* `params` {Array|Object}: notifications parameters. If object passed notifications will be delivered in a by-name fashion.

### namespace.sendInternalNotification(name[, params])

Sends an internal notification with given name and parameters to subscribed clients.
The only difference between this method and [sendNotification](#namespacesendnotificationname-params) is that this method
allows to send notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String}: name of notification
* `params` {Array|Object}: notifications parameters. If object passed notifications will be delivered in a by-name fashion.

### namespace.onNotification(name[, handler])

Subscribe to notification(s)

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)

### namespace.onInternalNotification(name[, handler])

Subscribe to internal notification(s)
The only difference between this method and [onNotification](#namespaceonnotificationname-handler) is that this method
allows to subscribe to notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)

### namespace.onceNotification(name[, handler])

Subscribe to given notification(s) once.

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)

### namespace.onceInternalNotification(name[, handler])

Subscribe to internal notification(s) once.
The only difference between this method and [onceNotification](#namespaceoncenotificationname-handler) is that this method
allows to subscribe to notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)

### namespace.offNotification(name[, handler])

Unsubscribe from notification(s)

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)


### namespace.offInternalNotification(name[, handler])

Unsubscribe from internal notification(s)
The only difference between this method and [offNotification](#namespaceoffnotificationname-handler) is that this method
allows to unsubscribe from notifications with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String|Object}: name of notification or mapping object which have notifications names as keys and notifications handlers as values.
* `handler` {function}: notification handler (should be passed only if `name` defined as string)

### namespace.registerMethod(name, handler)

Registers a method(s) with given name and handler

Parameters:
* `name` {String|Object}: name of method or mapping object which have methods names as keys and methods handlers as values.
* `handler` {function}: method handler (should be passed only if `name` defined as string)

### namespace.registerInternalMethod(name, handler)

Registers an internal method(s) with given name and handler
The only difference between this method and [registerMethod](#namespaceregistermethodname-handler) is that this method
allows to register methods with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String|Object}: name of method or mapping object which have methods names as keys and methods handlers as values.
* `handler` {function}: method handler (should be passed only if `name` defined as string)

### namespace.unregisterMethod(name)

Unregisters a method(s) with given names

Parameters:
* `name` {String|Array}: name of method or array of methods.

### namespace.unregisterInternalMethod(name, handler)

Unregisters an internal method(s) with given names
The only difference between this method and [unregisterMethod](#namespaceunregistermethodname) is that this method
allows to unregister methods with prefix "rpc." and adds this prefix if it's missing.

Parameters:
* `name` {String|Array}: name of method or array of methods.

### namespace.getRegisteredMethodsNames() -> Array

Returns list of registered methods names (not including internal methods)

### namespace.getRegisteredInternalMethodsNames() -> Array

Returns list of registered internal methods names (methods with "rpc." prefix)

### namespace.getClient(id) -> JSONRpcSocket | null

Returns instance of connected JSON RPC socket by its ID

Parameters:
* `id` {String|Number}: ID of connected socket

### namespace.getClients() -> Array<JSONRpcSocket>

Returns list of connected clients

### namespace.close()

Closes all connections related to namespace and removes this namespace

## JSONRpcSocket

All connected sockets is wrapping in RPCSocket class, that provides basic RPC operations like
call methods, send notifications etc.

### socket.getId() -> String | Number

Returns ID of connected socket

### socket.getSocket() -> WebSocket

Returns native websocket object

### socket.close([code[, data]])

Closes a WebSocket connection gracefully.

Parameters:
* `code` {Number}: Socket close code. Defaults to 1000.
* `data` {String}: Optional data to be sent to socket before closing.

### socket.callMethod(method[, params[, timeout[, ws_options]]]) -> Promise

Calls a registered RPC method on server.
Resolves once the response is ready.
Throws if an RPC error was received.

Parameters:
* `method` {String}: An RPC method name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the request.
* `timeout` {Number}: Optional RPC reply timeout in milliseconds.
* `ws_options` {Object}: Optional parameters passed to ws. Not available on web browsers.
  * `compress` {Boolean}: Specifies whether data should be compressed or not. Defaults to true when permessage-deflate is enabled.
  * `binary` {Boolean}: Specifies whether data should be sent as a binary or not. Default is autodetected.
  * `mask` {Boolean} Specifies whether data should be masked or not. Defaults to true when websocket is not a server client.
  * `fin` {Boolean} Specifies whether data is the last fragment of a message or not. Defaults to true.
  
### socket.callInternalMethod(method[, params[, timeout[, ws_options]]]) -> Promise

Calls an internal RPC method on server.
The only difference between this method and [callMethod](#socketcallmethodmethod-params-timeout-ws_options---promise) is that this method
allows to call methods with prefix "rpc." and adds this prefix if it's missing.

Parameters: See parameters of [callMethod](#socketcallmethodmethod-params-timeout-ws_options---promise)

### socket.listRemoteMethods() -> Promise

Resolves with list of remote methods (array of strings)
Rejects if RPC error was received

### socket.listRemoteEvents() -> Promise

Resolves with list of remote events (array of strings)
Rejects if RPC error was received

### socket.sendNotification(method[, params])

Sends a JSON-RPC 2.0 notification to server.

Parameters:
* `method` {String}: An RPC notification name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the notification.

### socket.sendInternalNotification(method[, params])

Sends an internal RPC notification to server.
The only difference between this method and [sendNotification](#socketsendnotificationmethod-params) is that this method
allows to send notifications with names with prefix "rpc." and adds this prefix if it's missing.

Parameters: See parameters of [sendNotification](#socketsendnotificationmethod-params)
