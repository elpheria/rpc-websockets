const expect = require("chai").expect
const spy = require("chai").spy
const INVALID_VALUES = require("../../_invalidValues")

module.exports = ({runWebSocketServer}) =>
{
    describe(".unregisterMethod()", () =>
    {
        it("Alias for \"unregisterMethod()\" of given namespace", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const NAMESPACE_NAME = "testNamespace"
            const namespace = server.createNamespace(NAMESPACE_NAME)
            namespace.unregisterMethod = spy()
            server.unregisterMethod(METHOD_NAME, NAMESPACE_NAME)
            expect(namespace.unregisterMethod).to.have.been.called.with(METHOD_NAME)
        })

        it("If no namespace passed - uses \"/\" namespace by default", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const NAMESPACE_NAME = "/"
            const namespace = server.createNamespace(NAMESPACE_NAME)
            namespace.unregisterMethod = spy()
            server.unregisterMethod(METHOD_NAME)
            expect(namespace.unregisterMethod).to.have.been.called.with(METHOD_NAME)
        })

        it("Does nothing if namespace is not exists", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const NON_EXISTING_NAMESPACE = "test"
            expect(() => server.unregisterMethod(METHOD_NAME, NON_EXISTING_NAMESPACE)).to.not.throw()
        })

        it("Throws an error if passed namespace name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const METHOD_NAME = "some_method"
            const invalidNames = INVALID_VALUES.STRING
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterMethod(METHOD_NAME, invalidName))
                    .to
                    .throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })
    })
}
