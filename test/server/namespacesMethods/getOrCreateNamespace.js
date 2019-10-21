const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const Namespace = require("../../../dist/lib/Namespace").default

module.exports = ({runWebSocketServer}) =>
{
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
                null, undefined, ...INVALID_VALUES.STRING__FILLED
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.getOrCreateNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
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
}