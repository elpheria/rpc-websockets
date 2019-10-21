const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const spy = require("chai").spy

module.exports = ({runWebSocketServer}) =>
{
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
                null, undefined, ...INVALID_VALUES.STRING__FILLED
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.closeNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
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
}