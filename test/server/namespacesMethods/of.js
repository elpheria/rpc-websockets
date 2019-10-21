const expect = require("chai").expect
const spy = require("chai").spy

module.exports = ({runWebSocketServer}) =>
{
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
}