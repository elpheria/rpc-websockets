/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

require("chai").use(require("chai-spies"))

const expect = require("chai").expect
const spy = require("chai").spy
const WebSocket = require("ws")
const _WebSocketServer = require("../dist").Server
const JsonRPCSocket = require("../dist/lib/JsonRpcSocket").default
const Namespace = require("../dist/lib/Namespace").default

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
    return new Promise((resolve, reject) =>
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

/**
 * Helper that checks whether some event properly propagates from one class to another
 * (check that it fires on both classes with same name and same arguments)
 * @param {string} event - event to check
 * @param {any} propagatesFrom - source of event
 * @param {any} propagatesTo - destination object to propagate
 * @param {function} done - success/error handler
 * @returns {void}
 */
function checkEventPropagation({event, propagatesFrom, propagatesTo, done})
{
    let argsInFrom
    let argsInTo
    const compareArgs = () =>
    {
        if (argsInFrom && argsInTo)
        {
            try
            {
                expect(argsInTo).to.be.deep.equal(argsInFrom)
                done()
            }
            catch (e)
            {
                done(e)
            }
        }
    }
    propagatesFrom.on(event, (...args) =>
    {
        argsInFrom = args
        compareArgs()
    })
    propagatesTo.on(event, (...args) =>
    {
        argsInTo = args
        compareArgs()
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

    describe(".constructor()", () =>
    {
        it("Allows to not pass any parameters at all", () =>
        {
            expect(() => new WebSocketServer()).to.not.throw()
        })

        it("Starts on random free port if no \"port\" parameter specified", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.port).to.be.equal(0)
        })

        it("Throws an error if \"strict_notifications\" parameter is not boolean value", () =>
        {
            const invalidValues = [
                -1, 0, 1, 2.56, -Infinity, Infinity,
                "", " ", "abc",
                null,
                [], ["some"], {}, {prop: "some"}
            ]

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        strict_notifications: invalidValue
                    })
                }).to.throw(TypeError, `"strict_notifications" should be boolean, "${invalidValue === null ? "null" : typeof invalidValue}" given`)
            }
        })

        it("\"strict_notifications\" parameter is boolean \"true\" by default", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.strict_notifications).to.be.equal(true)
        })

        it("Throws an error if \"idParam\" is not a string", () =>
        {
            const invalidValues = [
                -1, 0, 1, 2.56, -Infinity, Infinity,
                true, false,
                null,
                [], ["some"], {}, {prop: "some"}
            ]

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        idParam: invalidValue
                    })
                }).to.throw(TypeError, `"idParam" should be a string, "${invalidValue === null ? "null" : typeof invalidValue}" given`)
            }
        })

        it("Throws an error if \"idParam\" is an empty string", () =>
        {
            const invalidValues = ["", " ", "   "]

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        idParam: invalidValue
                    })
                }).to.throw(TypeError, "\"idParam\" can not be empty string")
            }
        })

        it("automatically trim leading and trailing spaces around \"idParam\" property", () =>
        {
            const idParam = "  test  "
            const trimmedIdParam = "test"
            const server = new WebSocketServer({idParam})
            expect(server.options.idParam).to.be.equal(trimmedIdParam)
        })

        it("\"idParam\" parameter is \"socket_id\" by default", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.idParam).to.be.equal("socket_id")
        })

        it("Should return a new Server instance", () =>
        {
            const server = new WebSocketServer()
            expect(server).to.be.an.instanceOf(_WebSocketServer)
        })
    })

    describe(".wss", () =>
    {
        it("contains instance of websocket server from \"ws\" library", () =>
        {
            const server = new WebSocketServer()
            expect(server.wss).to.be.an.instanceOf(WebSocket.Server)
        })
    })

    describe(".close()", () =>
    {
        it("Closes the server", async () =>
        {
            const server = await runWebSocketServer()
            await server.close()
            expect(server.wss.address()).to.be.equal(null)
        })

        it("Returns a promise, which resolves once server is closed", async () =>
        {
            const server = await runWebSocketServer()
            const output = server.close()
            expect(output).to.be.instanceOf(Promise)
        })
    })

    describe(".getRPCSocket()", () =>
    {
        it("Expects socket ID passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const clientId = "my_client"
            await connectTo({server, id: clientId})
            return expect(server.getRPCSocket(clientId)).to.exist
        })

        it("Throws an error if no socket ID passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidIds = [
                null, undefined, ""
            ]
            for (const invalidId of invalidIds)
            {
                expect(() => server.getRPCSocket(invalidId)).to.throw(TypeError, "No socket ID passed")
            }
        })

        it("Throws an error if passed socket ID is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidIds = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidId of invalidIds)
            {
                expect(() => server.getRPCSocket(invalidId)).to.throw(TypeError, `Expected Socket ID as number, ${typeof invalidId} passed`)
            }
        })

        it("Returns JsonRPCSocket instance if socket with given ID connected", async () =>
        {
            const server = await runWebSocketServer()
            const clientId = "getRPCSocket_positive_test"
            await connectTo({server, id: clientId})
            return expect(server.getRPCSocket(clientId)).to.be.instanceOf(JsonRPCSocket)
        })

        it("Returns null if socket with given ID is not connected", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.getRPCSocket("non-existing client")).to.equal(null)
        })
    })

    describe(".createNamespace()", () =>
    {
        it("Expects namespace name to be passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            expect(() => server.createNamespace(namespaceName)).to.not.throw()
            expect(server.hasNamespace(namespaceName)).to.exist
        })

        it("Throws an error if no namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined, "", "   "
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.createNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.createNamespace(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })

        it("Throws an error if namespace with given name already exists", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            server.createNamespace(namespaceName)
            return expect(() => server.createNamespace(namespaceName))
                .to
                .throw(
                    Error,
                    `Failed to create namespace: Namespace with name ${namespaceName} already exists`
                )
        })

        it("Returns created namespace instance", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.createNamespace("my_namespace")).to.be.instanceOf(Namespace)
        })
    })

    describe(".hasNamespace()", () =>
    {
        it("Expects namespace name to be passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            server.createNamespace(namespaceName)
            expect(server.hasNamespace(namespaceName)).to.be.equal(true)
        })

        it("Throws an error if no namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined, "", "   "
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.hasNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.hasNamespace(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })

        it("Returns boolean \"true\" if namespace with given name exists", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "new_namespace"
            server.createNamespace(namespaceName)
            return expect(server.hasNamespace(namespaceName)).to.be.equal(true)
        })

        it("Returns boolean \"false\" if namespace with given name not exists", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.hasNamespace("non-existing namespace")).to.be.equal(false)
        })
    })

    describe(".getNamespace()", () =>
    {
        it("Expects namespace name to be passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            server.createNamespace(namespaceName)
            expect(server.getNamespace(namespaceName)).to.exist
        })

        it("Throws an error if no namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined, "", "   "
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.getNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.getNamespace(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })

        it("Returns Namespace instance if namespace with given name exists", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "new_namespace"
            server.createNamespace(namespaceName)
            return expect(server.getNamespace(namespaceName)).to.be.instanceOf(Namespace)
        })

        it("Returns null if namespace with given name not exists", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.getNamespace("non-existing namespace")).to.be.equal(null)
        })
    })

    describe(".getOrCreateNamespace()", () =>
    {
        it("Expects namespace name to be passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            server.createNamespace(namespaceName)
            expect(() => server.getOrCreateNamespace(namespaceName)).to.not.throw
        })

        it("Throws an error if no namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined, "", "   "
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.getOrCreateNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.getOrCreateNamespace(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })

        it("Returns new Namespace instance if namespace with given name not exists", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.getOrCreateNamespace("newNS")).to.be.instanceOf(Namespace)
        })

        it("Returns existing Namespace instance if namespace with given name exists", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "myNS"
            const namespaceInstance = server.createNamespace(namespaceName)
            return expect(server.getOrCreateNamespace(namespaceName))
                .to.be.equal(namespaceInstance)
        })
    })

    describe(".closeNamespace()", () =>
    {
        it("Expects namespace name to be passed as first argument", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "some_name_of_namespace"
            server.createNamespace(namespaceName)
            expect(() => server.closeNamespace(namespaceName)).to.not.throw
        })

        it("Throws an error if no namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined, "", "   "
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.closeNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                -Infinity, -12, -3.18, 0, 1, 2.14, Infinity,
                true, false,
                [], [1], {}, {a: 2}
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.closeNamespace(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })

        it("Does nothing if namespace with given name not exists", async () =>
        {
            const server = await runWebSocketServer()
            return expect(server.closeNamespace("non-existing namespace")).to.not.throw
        })

        it("Closes all connections that belongs to given namespace and removes it", async () =>
        {
            const server = await runWebSocketServer()
            const namespaceName = "myNS"
            const ns = server.createNamespace(namespaceName)
            spy.on(ns, "close")
            server.closeNamespace(namespaceName)
            expect(ns.close).to.have.been.called()
            expect(server.getNamespace(namespaceName)).to.be.equal(null)
        })
    })

    describe(".of()", () =>
    {
        it("Is an alias for \"getOrCreateNamespace\" method", async () =>
        {
            const server = await runWebSocketServer()
            spy.on(server, "getOrCreateNamespace")
            server.of("some_namespace")
            expect(server.getOrCreateNamespace).to.have.been.called()
        })
    })

    describe("Events", () =>
    {
        describe("Propagates the following events from \"ws\" library server:", () =>
        {
            it("\"listening\"", (done) =>
            {
                const server = new WebSocketServer()
                checkEventPropagation({
                    event: "listening",
                    propagatesFrom: server.wss,
                    propagatesTo: server,
                    done
                })
            })

            it("\"connection\"", async () =>
            {
                const server = await runWebSocketServer()
                return new Promise((resolve, reject) =>
                {
                    checkEventPropagation({
                        event: "connection",
                        propagatesFrom: server.wss,
                        propagatesTo: server,
                        done: (e) => {e ? reject(e) : resolve()}
                    })
                    connectTo({server})
                })
            }).timeout(5000)

            it("\"error\"", async () =>
            {
                const server1 = await runWebSocketServer()
                const server2 = new WebSocketServer({port: server1.wss.address().port})
                return new Promise((resolve, reject) =>
                {
                    checkEventPropagation({
                        event: "error",
                        propagatesFrom: server2.wss,
                        propagatesTo: server2,
                        done: (e) => {e ? reject(e) : resolve()}
                    })
                })
            }).timeout(5000)
        })

        describe("\"RPCConnection\"", () =>
        {
            it("Emitted on rpc client connected", async () =>
            {
                const server = await runWebSocketServer()
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", resolve)
                    connectTo({server})
                })
            })

            it("Connected JsonRPCSocket instance passed in first argument", async () =>
            {
                const server = await runWebSocketServer()
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socketInstance) =>
                    {
                        resolve(
                            expect(socketInstance).to.be.an.instanceOf(JsonRPCSocket)
                        )
                    })
                    connectTo({server})
                })
            })

            it("Request object passed in second argument", async () =>
            {
                const server = await runWebSocketServer()
                let expectedRequest = null
                server.on("connection", (socket, request) =>
                {
                    expectedRequest = request
                })
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socket, request) =>
                    {
                        resolve(
                            expect(request).to.equal(expectedRequest)
                        )
                    })
                    connectTo({server})
                })
            })
        })
    })

    describe("behaviors", () =>
    {
        it("Starts listening to connections immediately", (done) =>
        {
            const server = new WebSocketServer()
            server.on("listening", () => done())
        })

        describe("connection ID handling", () =>
        {
            it("Set ID of connection according to id passed in query", async () =>
            {
                const server = await runWebSocketServer()
                const connectionId = "abc"
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socket) =>
                    {
                        resolve(
                            expect(socket.getId()).to.equal(connectionId)
                        )
                    })
                    connectTo({server, id: connectionId})
                })
            })

            it("Set random ID if no ID passed in query", async () =>
            {
                const server = await runWebSocketServer()
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socket) =>
                    {
                        resolve(
                            expect(socket.getId()).to.exist
                        )
                    })
                    connectTo({server})
                })
            })

            it("Searches ID in query according to property specified in config", async () =>
            {
                const ID_PARAM = "my_custom_ID_prop"
                const server = await runWebSocketServer({
                    idParam: ID_PARAM
                })
                const connectionId = "my_id"
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socket) =>
                    {
                        resolve(
                            expect(socket.getId()).to.equal(connectionId)
                        )
                    })
                    connectTo({server, id: connectionId, idParam: ID_PARAM})
                })
            })

            it("Uses \"socket_id\" as ID property by default", async () =>
            {
                const server = await runWebSocketServer()
                const connectionId = "my_id"
                return new Promise((resolve) =>
                {
                    server.on("RPCConnection", (socket) =>
                    {
                        resolve(
                            expect(socket.getId()).to.equal(connectionId)
                        )
                    })
                    connectTo({server, id: connectionId, idParam: "socket_id"})
                })
            })
        })

        it("Creates a namespace with name that equals to path of connection and bind connection to this namespace", async () =>
        {
            const server = await runWebSocketServer()
            const paths = ["/", "/somePath", "/anotherPath"]
            const clientId = "123"
            for (const path of paths)
            {
                await connectTo({server, path, id: clientId})
                expect(server.hasNamespace(path)).to.equal(true)
                expect(server.getNamespace(path).hasClient(clientId)).to.equal(true)
            }
        })

        it("Removes closed websocket from list of connected", async () =>
        {
            const server = await runWebSocketServer()
            const connectionId = "abc"
            const client = await connectTo({server, id: connectionId})
            await new Promise((resolve) =>
            {
                client.once("close", resolve)
                client.close()
            })
            // wait a little, without that will not work:
            await new Promise((resolve) => setTimeout(resolve, 50))
            return expect(server.getRPCSocket(connectionId)).to.not.exist
        })
    })
})
