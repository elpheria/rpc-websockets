<div align="center">
  <a href="https://github.com/elpheria/rpc-websockets">
    <img src="https://github.com/elpheria/rpc-websockets/blob/master/misc/images/logo.png">
  </a>
  <br>
  <p>
    WebSockets for <a href="http://nodejs.org">Node.js</a> and <a href="https://en.wikipedia.org/wiki/JavaScript">JavaScript</a> with <a href="https://www.jsonrpc.org/specification">JSON RPC 2.0</a> support on top.  </p>
  <br>
	<a href="https://github.com/elpheria/rpc-websockets/blob/master/LICENSE">
		<img src="https://github.com/elpheria/rpc-websockets/blob/master/misc/images/mit.svg">
	</a>
  <a href="https://travis-ci.org/elpheria/rpc-websockets">
		<img src="https://travis-ci.org/elpheria/rpc-websockets.svg?branch=master">
	</a>
  <a href="https://coveralls.io/github/elpheria/rpc-websockets?branch=master">
		<img src="https://coveralls.io/repos/github/elpheria/rpc-websockets/badge.svg?branch=master">
	</a>
  <a href="https://www.npmjs.com/package/rpc-websockets">
    <img src="https://img.shields.io/npm/dm/rpc-websockets.svg?maxAge=2592000">
  </a>
  <br>
  <a href="https://nodei.co/npm/rpc-websockets">
		<img src="https://nodei.co/npm/rpc-websockets.png?downloads=true&downloadRank=true&stars=true">
	</a>
  <br><br><br>
</div>

## About

The **rpc-websockets** library enables developers to easily implement their business logic that includes messaging between users, machines or any devices. It provides a possibility to send and receive JSON data through the WebSocket communication protocol in order to support two-way notification push, running RPC methods and firing any types of event signalling. Both frontend (HTML/JS-based) and backend (Node.js-based) development environments are supported.

**rpc-websockets** is built on Node.js and supports both LTS and Current versions.

Use the free OSS version in order to implement and manage your own WebSocket server instances, or subscribe for our [Pro plan](#pro-features) and have us manage your instances and provide you with management of your methods, events and notifications on an easy-to-use Web Management portal.

## Quick start

Install our OSS library in your project:
```
npm install rpc-websockets
```

Write your source code using `rpc-websockets`:
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

// get events
console.log(server.eventList())

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

## Documentation

Please consult our [API documentation](API.md) for both WebSocket server and client JavaScript classes.

## Migrating to 3.x/4.x

Departing from version 2.x, there's been some minor API changes. A breaking change is a server.eventList method, which is not a getter method anymore, because of the inclusion of a namespaces system throughout the library. Other methods will work seamlessly.

## OSS Features

All library's open-source features are documented in our [API documentation](API.md) and can be used free of charge. You are free to implement your solutions based on provided methods in any way you are comfortable with, as long as you use our work along our [license](LICENSE).

## Pro Features

It order to support your production-ready environments, we can provide you with additional features built on top of our free OSS version along with the skill set to turn your business case or a Proof-of-Concept idea into reality.
Describe us your use case by [contacting us](mailto:mario.kozjak@qaap.io?subject=Pro%20Plan%20enquiry) and we will swiftly get back to you with a proposed solution that meets your needs.

## License

  [MIT](LICENSE)
