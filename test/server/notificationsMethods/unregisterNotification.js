const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")

module.exports = ({runWebSocketServer}) =>
{
    describe(".unregisterNotification()", () =>
    {
        it("Expects notification name to be passed in first argument", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "some_notification"
            server.registerNotification(NOTIFICATION_NAME)
            expect(() => server.unregisterNotification(NOTIFICATION_NAME)).to.not.throw()
            expect(server.getRegisteredNotifications().includes(NOTIFICATION_NAME)).to.be.equal(false)
        })

        it("Allows to pass multiple notification names as array in first argument", async () =>
        {
            const server = await runWebSocketServer()
            const notifications = [
                "notification1",
                "notification2"
            ]
            server.registerNotification(notifications)
            expect(() => server.unregisterNotification(notifications)).to.not.throw()
            expect(
                notifications.every(
                    (notification) => !server.getRegisteredNotifications().includes(notification)
                )
            ).to.be.equal(true)
        })

        it("Throws an error if notification name is not a string (except if array passed)", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                null, undefined,
                ...INVALID_VALUES.STRING.filter((i) => !Array.isArray(i))
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification(invalidName))
                    .to
                    .throw(
                        TypeError,
                        `Notification name should be a string, ${invalidName === null ? "null" : typeof invalidName} passed`
                    )
            }
        })

        it("Throws an error if passed array of notification names contains invalid name", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = [
                [null], [undefined],
                ...INVALID_VALUES.STRING.map((invalidValue) => [invalidValue])
            ]
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification(invalidName))
                    .to
                    .throw(
                        TypeError,
                        `Notification name should be a string, ${invalidName[0] === null ? "null" : typeof invalidName[0]} passed`
                    )
            }
        })

        it("Throws an error if notification name is empty", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING__FILLED
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification(invalidName)).to.throw(Error, "Given notification name is empty")
            }
        })

        it("Throws an error if notification name starts with 'rpc.'", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = ["rpc.someNotification", ["rpc.someNotification"]]
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification(invalidName)).to.throw(Error,
                    "Notifications with prefix \"rpc.\" is for internal usage only"
                )
            }
        })

        it("Do nothing if notification with given name not exists", async () =>
        {
            const server = await runWebSocketServer()
            const notificationsToTest = ["some_notification", ["some_notification"], ["some_notification", "some_notification"]]
            for (const notification of notificationsToTest)
            {
                expect(() => server.unregisterNotification(notification)).to.not.throw()
            }
        })

        it("Unregisters a notification from given namespace that is passed in second argument", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "some_notification"
            const NAMESPACE_NAME = "someNamespace"
            server.createNamespace(NAMESPACE_NAME)
            server.registerNotification(NOTIFICATION_NAME, NAMESPACE_NAME)
            server.unregisterNotification(NOTIFICATION_NAME, NAMESPACE_NAME)
            expect(server.getRegisteredNotifications(NAMESPACE_NAME).includes(NOTIFICATION_NAME)).to.be.equal(false)
        })

        it("If no namespace name passed - unregisters notification from root namespace by default", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "some_notification"
            server.registerNotification(NOTIFICATION_NAME, "/")
            server.unregisterNotification(NOTIFICATION_NAME)
            expect(server.getRegisteredNotifications("/").includes(NOTIFICATION_NAME)).to.be.equal(false)
        })

        it("Does nothing if given namespace not exists", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "some_notification"
            const NAMESPACE_NAME = "someNamespace"
            expect(() => server.unregisterNotification(NOTIFICATION_NAME, NAMESPACE_NAME)).to.not.throw()
        })

        it("Doesn't kill namespace if there is no other notifications bound to it after last notification deleted", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "some_notification"
            const NAMESPACE_NAME = "someNamespace"
            server.createNamespace(NAMESPACE_NAME)
            server.registerNotification(NOTIFICATION_NAME, NAMESPACE_NAME)
            server.unregisterNotification(NOTIFICATION_NAME, NAMESPACE_NAME)
            expect(server.hasNamespace(NAMESPACE_NAME)).to.be.equal(true)
        })

        it("Throws an error if empty namespace name is passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING__FILLED
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification("new_notification", invalidName)).to.throw(TypeError, "No namespace name is passed")
            }
        })

        it("Throws an error if passed namespace name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNames = INVALID_VALUES.STRING
            for (const invalidName of invalidNames)
            {
                expect(() => server.unregisterNotification("new_notification", invalidName)).to.throw(TypeError, `Name of namespace should be a string, ${typeof invalidName} passed`)
            }
        })
    })
}
