<div align="center"><img src="misc/images/logo.png"/></div>

WebSockets for [node](http://nodejs.org) with JSON RPC 2.0 support on top.

[![GitHub license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/qaap/rpc-websockets/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/qaap/rpc-websockets.svg?branch=master)](https://travis-ci.org/qaap/rpc-websockets)
[![Coverage Status](https://coveralls.io/repos/github/qaap/rpc-websockets/badge.svg?branch=master)](https://coveralls.io/github/qaap/rpc-websockets?branch=master)
[![npm](https://img.shields.io/npm/dm/rpc-websockets.svg?maxAge=2592000)](https://www.npmjs.com/package/rpc-websockets)  
[![NPM](https://nodei.co/npm/rpc-websockets.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/rpc-websockets/)

## Installation

```
npm install rpc-websockets
```

## Examples

```js
var WebSocket = require('rpc-websockets').Client
var WebSocketServer = require('rpc-websockets').Server

// instantiate Server and start listening for requests
var server = new WebSocketServer({
  port: 8080,
  host: 'localhost'
})

// register an RPC method
server.register('sum', function(params) {
  return params[0] + params[1]
})

// create an event
server.event('feedUpdated')

// get events (getter method)
console.log(server.eventList)

// emit an event to subscribers
server.emit('feedUpdated')

// close the server
server.close()

// instantiate Client and connect to an RPC server
var ws = new WebSocket('ws://localhost:8080')

ws.on('open', function() {
  // call an RPC method with parameters
  ws.call('sum', [5, 3]).then(function(result) {
    require('assert').equal(result, 8)
  })

  // send a notification to an RPC server
  ws.notify('openedNewsModule')

  // subscribe to receive an event
  ws.subscribe('feedUpdated')

  ws.on('feedUpdated', function() {
    updateLogic()
  })

  // unsubscribe from an event
  ws.unsubscribe('feedUpdated')

  // close a websocket connection
  ws.close()
})
```

## Client

```js
var WebSocket = require('rpc-websockets').Client
var ws = new WebSocket('ws://localhost:8080')
```

### new WebSocket(address[, options]) -> Client

Instantiate a WebSocket client.

Parameters:
* `address` {String}: The URL of the WebSocket server. Defaults to 'ws://localhost:8080'.
* `options` {Object}: Client options that are also forwarded to `ws`.
  * `autoconnect` {Boolean}: Client autoconnect upon Client class instantiation. Defaults to `true`.
  * `reconnect` {Boolean}: Whether client should reconnect automatically once the connection is down. Defaults to `true`.
  * `reconnect_interval` {Number}: Time between adjacent reconnects. Defaults to `1000`.
  * `max_reconnects` {Number}: Maximum number of times the client should try to reconnect. Defaults to `5`.

### ws.call(method[, params[, timeout]]) -> Promise

Calls a registered RPC method on server. Resolves once the response is ready. Throws if an RPC error was received.

Parameters:
* `method` {String}: An RPC method name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the request.
* `timeout` {Number}: Optional RPC reply timeout in milliseconds.

### ws.notify(method[, params])

Sends a JSON-RPC 2.0 notification to server.

Parameters:
* `method` {String}: An RPC method name to run on server-side.
* `params` {Object|Array}: Optional parameter(s) to be sent along the request.

### ws.subscribe(event) -> Promise

Subscribes for a defined event.

Parameters:
* `event` {String}: Event name.

### ws.unsubscribe(event) -> Promise

Unsubscribes from a defined event.

Parameters:
* `event` {String}: Event name.

### ws.close([code[, data]])

Closes a WebSocket connection gracefully.

Parameters:
* `code` {Number}: Socket close code.
* `data` {String}: Optional data to be sent to socket before closing.

### Event: 'open'

Emits when the connection is opened and ready for use.

### Event: 'error'

* &lt;Error&gt;

Emits when a socket error is raised.

### Event: 'close'

Emits when the connection is closed.

### Event: &lt;Notification&gt;

* &lt;Object&gt;

Emits a notification event with possible parameters a client has subscribed to once the server sends it.

Example:
```js
ws.subscribe('feedUpdated')

ws.on('feedUpdated', handlerFunction)
```

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

Once the Server class is instantiated, you can use a `ws` library's instance via server.wss object.

### server.register(method, callback)

Registers an RPC method.

Parameters:
* `method` {String}: RPC method name.
* `callback` {Function}: RPC function that will be fired with a possible parameter object once the method is called.

### server.event(name)

Creates a new event that can be emitted to clients.

Parameters:
* `name` {String}: Name of the event.

### server.emit(name[, ...params])

Emits a created event to clients.

Parameters:
* `name` {String}: Name of the event.
* `...params`: Parameters forwarded to clients.

### **get** server.eventList -> Array

Lists all created events.

### server.of(name) -> Namespace

Returns a Namespace object initialized by the provided pathname upon connecting(eg: ```/chat```).
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

### server.close() -> Promise

Closes the server and terminates all clients.

### Event: 'listening'

Emits when the server has started listening for requests.

### Event: 'error'

* &lt;Error&gt;

Emits when a server error is raised.

## Namespaces
Namespace represents a pool of sockets connected under a given scope identified by a pathname (eg: ```/chat```). Basically borrows ideas from ```socket.io```.

### namespace.name -> String

Returns a namespace identifier.

### namespace.connected() -> Object

Returns a hash of websocket objects connected to this namespace, identified by ```id```.

### namespace.emit(name[, ...params])

Emits a created event to clients connected to this namespace.

Parameters:
* `name` {String}: Name of the event.
* `...params`: Parameters forwarded to clients in this namespace.

### namespace.clients() -> Array

Returns a list of client unique identifiers connected to this namespace.

## License

  [MIT](LICENSE)
