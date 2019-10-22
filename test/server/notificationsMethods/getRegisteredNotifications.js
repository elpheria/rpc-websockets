const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")

module.exports = ({runWebSocketServer}) =>
{
    describe(".getRegisteredNotifications()", () =>
    {
        it("Returns list of registered notifications under given namespace", async () =>
        {
            const server = await runWebSocketServer()
            const notifications = ["notification1", "notification2"]
            const NAMESPACE_NAME = "someNamespace"
            server.registerNotification(notifications, NAMESPACE_NAME)
            expect(server.getRegisteredNotifications(NAMESPACE_NAME)).to.include.members(notifications)
        })

        it("If no namespace name passed - uses root namespace by default", async () =>
        {
            const server = await runWebSocketServer()
            const notifications = ["notification1", "notification2"]
            server.registerNotification(notifications, "/")
            expect(server.getRegisteredNotifications()).to.include.members(notifications)
        })

        it("Returns empty array if given namespace don't exists", async () =>
        {
            const server = await runWebSocketServer()
            const NAMESPACE_NAME = "non-existing-namespace"
            expect(server.getRegisteredNotifications(NAMESPACE_NAME).length).to.equal(0)
        })

        it("Throws an error if empty namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING__FILLED
            for (const invalidName of invalidNames)
            {
                expect(() => server.getRegisteredNotifications(invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed namespace name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
            for (const invalidName of invalidNames)
            {
                expect(() => server.getRegisteredNotifications(invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })
    })
}
