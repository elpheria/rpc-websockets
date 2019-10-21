"use strict"

require("chai").use(require("chai-spies"))

const WebSocket = require("ws")
const _WebSocketServer = require("../../dist").Server

const testConstructor = require("./constructor")
const testProps = require("./props")
const testCommonMethods = require("./commonMethods")
const testSocketMethods = require("./socketsMethods")
const testNamespacesMethods = require("./namespacesMethods")
const testNotificationsMethods = require("./notificationsMethods")
const testEvents = require("./events")
const testBehavoirs = require("./behaviors")

const serverInstances = []
const clientInstances = []

/**
 * Instantiate a new server (used to collect all created instances of server and destroy at the end
 * of each test)
 * @returns {WebSocketServer}
 */
function WebSocketServer(...args)
{
    const server = new _WebSocketServer(...args)
    serverInstances.push(server)
    return server
}

/**
 * Returns a new WebSocketServer instance.
 * @param {array} args - arguments to pass to WebSocketServer constructor
 * @return {WebSocketServer}
 */
function runWebSocketServer(...args)
{
    return new Promise((resolve) =>
    {
        const wss = new WebSocketServer(...args)

        wss.on("listening", () => resolve(wss))
    })
}

/**
 * Connects to an RPC server.
 * @param {WebSocketServer} server - server to connect to
 * @param {String} path - uri path
 * @param {String} id - ID of connection
 * @param {string} idParam - name of parameter to pass ID of connection
 * @return {Promise}
 */
function connectTo({server, path, id, idParam = "socket_id"})
{
    const HOST = server.wss.address().address.replace("::", "localhost")
    const PORT = server.wss.address().port
    const query = id ? `?${idParam}=${id}` : ""
    return new Promise((resolve, reject) =>
    {
        const client = new WebSocket(`ws://${HOST}:${PORT}${path || "/"}${query || ""}`)
        clientInstances.push(client)
        client.on("open", () => resolve(client))
        client.on("error", (error) => reject(error))
    })
}

describe("Server", () =>
{
    afterEach(async () =>
    {
        await Promise.all(
            serverInstances.map((server) => server.close())
        )
        await Promise.all(
            clientInstances.map((client) => client.close())
        )
    })

    testConstructor({WebSocketServer})
    testProps({WebSocketServer})
    testCommonMethods({runWebSocketServer})
    testSocketMethods({runWebSocketServer, connectTo})
    testNamespacesMethods({runWebSocketServer})
    testNotificationsMethods({runWebSocketServer})
    testEvents({WebSocketServer, runWebSocketServer, connectTo})
    testBehavoirs({WebSocketServer, runWebSocketServer, connectTo})
})
