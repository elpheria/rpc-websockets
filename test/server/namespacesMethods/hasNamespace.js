const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")

module.exports = ({runWebSocketServer}) =>
{
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
                null, undefined, ...INVALID_VALUES.STRING__FILLED
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.hasNamespace(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
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
}