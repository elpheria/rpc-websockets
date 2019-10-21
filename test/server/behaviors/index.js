const expect = require("chai").expect

module.exports = ({WebSocketServer, runWebSocketServer, connectTo}) =>
{
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
}