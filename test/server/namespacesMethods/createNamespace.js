const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const Namespace = require("../../../dist/lib/Namespace").default

module.exports = ({runWebSocketServer}) =>
{
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
                null, undefined, ...INVALID_VALUES.STRING__FILLED
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.createNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
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
}