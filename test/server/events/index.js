const expect = require("chai").expect
const JsonRPCSocket = require("../../../dist/lib/JsonRpcSocket").default

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

module.exports = ({WebSocketServer, runWebSocketServer, connectTo}) =>
{
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
}