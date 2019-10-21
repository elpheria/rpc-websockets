const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const JsonRPCSocket = require("../../../dist/lib/JsonRpcSocket").default

module.exports = ({runWebSocketServer, connectTo}) =>
{
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
                null, undefined, ...INVALID_VALUES.STRING__NON_EMPTY
            ]
            for (const invalidId of invalidIds)
            {
                expect(() => server.getRPCSocket(invalidId)).to.throw(TypeError, "No socket ID passed")
            }
        })

        it("Throws an error if passed socket ID is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidIds = INVALID_VALUES.STRING
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
}