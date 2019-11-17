const expect = require("chai").expect
const spy = require("chai").spy
const INVALID_VALUES = require("../../_invalidValues")

module.exports = ({runWebSocketServer}) =>
{
    describe(".registerMethod()", () =>
    {
        it("Alias for \"registerMethod()\" of given namespace", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const METHOD_HANDLER = () => {}
            const NAMESPACE_NAME = "testNamespace"
            const namespace = server.createNamespace(NAMESPACE_NAME)
            namespace.registerMethod = spy()
            server.registerMethod(METHOD_NAME, METHOD_HANDLER, NAMESPACE_NAME)
            expect(namespace.registerMethod).to.have.been.called.with(METHOD_NAME, METHOD_HANDLER)
        })

        it("If no namespace passed - uses \"/\" namespace by default", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const METHOD_HANDLER = () => {}
            const NAMESPACE_NAME = "/"
            const namespace = server.createNamespace(NAMESPACE_NAME)
            namespace.registerMethod = spy()
            server.registerMethod(METHOD_NAME, METHOD_HANDLER)
            expect(namespace.registerMethod).to.have.been.called.with(METHOD_NAME, METHOD_HANDLER)
        })

        it("Creates namespace if it is not already exists", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const METHOD_HANDLER = () => {}
            const NON_EXISTING_NAMESPACE = "test"
            server.registerMethod(METHOD_NAME, METHOD_HANDLER, NON_EXISTING_NAMESPACE)
            expect(server.hasNamespace(NON_EXISTING_NAMESPACE)).to.be.equal(true)
        })

        it("Throws an error if passed namespace name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const METHOD_HANDLER = () => {}
            const invalidNames = INVALID_VALUES.STRING
            for (const invalidName of invalidNames)
            {
                expect(() => server.registerMethod(METHOD_NAME, METHOD_HANDLER, invalidName))
                    .to
                    .throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })
    })
}
