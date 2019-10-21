const expect = require("chai").expect

module.exports = ({runWebSocketServer}) =>
{
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
}
