const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const ExternallyResolvablePromise = require("../../__helpers__/ExternallyResolvalePromise")

module.exports = ({runWebSocketServer, connectTo}) =>
{
    /**
     * Prepare client and server to work together
     * @returns {Promise}
     */
    async function prepareClientAndServer()
    {
        const server = await runWebSocketServer()
        const serverGotConnection = new ExternallyResolvablePromise()
        server.on("RPCConnection", serverGotConnection.resolve)
        const client = connectTo({server})
        return Promise
            .all([serverGotConnection, client])
            .then(([, client]) => ({server, client}))
    }

    describe(".onInternalNotification()", () =>
    {
        it("Expects notification name to be passed in first argument and handler to be passed in second", async () =>
        {
            const {server, client} = await prepareClientAndServer()
            const testPassed = new ExternallyResolvablePromise()
            const NOTIFICATION_NAME = "rpc.testNotification"
            server.onInternalNotification(NOTIFICATION_NAME, testPassed.resolve)
            client.send(JSON.stringify({
                jsonrpc: "2.0",
                method: NOTIFICATION_NAME
            }))
            return testPassed
        })

        it("Allows to pass multiple notification names and handlers as object in first argument", async () =>
        {
            const {server, client} = await prepareClientAndServer()
            const notificationsNames = ["rpc.notification1", "rpc.notification2"]
            const notificationsTrackers = notificationsNames.map(() => new ExternallyResolvablePromise())
            const notificationsToRegister = notificationsNames.reduce((result, notificationName, i) =>
            {
                result[notificationName] = notificationsTrackers[i].resolve
                return result
            }, {})
            server.onInternalNotification(notificationsToRegister)
            notificationsNames.forEach((notificationName) =>
            {
                client.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method: notificationName
                }))
            })
            return Promise.all(notificationsTrackers)
        })

        it("Throws an error if notification name is not a string (except if object passed)", async () =>
        {
            const server = await runWebSocketServer()
            const invalidValues = INVALID_VALUES.STRING.filter(
                (value) => !value || Array.isArray(value) || typeof value !== "object"
            )
            for (const invalidValue of invalidValues)
            {
                expect(() => server.onInternalNotification(invalidValue, () => {})).to.throw(TypeError, "Subsciptions is not a mapping of names to handlers")
            }
        })

        it("Throws an error if notification name is empty", async () =>
        {
            const server = await runWebSocketServer()
            const invalidValues = INVALID_VALUES.STRING__FILLED
            for (const invalidValue of invalidValues)
            {
                expect(() => server.onInternalNotification(invalidValue, () => {})).to.throw(Error, "Given notification name is empty")
                expect(() => server.onInternalNotification({[invalidValue]: () => {}})).to.throw(Error, "Given notification name is empty")
            }
        })

        it("Automatically adds 'rpc.' prefix to notification name", async () =>
        {
            const {server, client} = await prepareClientAndServer()
            const testPassed = new ExternallyResolvablePromise()
            const NOTIFICATION_NAME = "testNotification"
            server.onInternalNotification(NOTIFICATION_NAME, testPassed.resolve)
            client.send(JSON.stringify({
                jsonrpc: "2.0",
                method: `rpc.${NOTIFICATION_NAME}`
            }))
            return testPassed
        })

        it("Throws an error if invalid notification handler passed", async () =>
        {
            const server = await runWebSocketServer()
            const invalidValues = INVALID_VALUES.FUNCTION
            for (const invalidValue of invalidValues)
            {
                // if two arguments passed:
                expect(() => server.onInternalNotification("some_notification", invalidValue))
                    .to
                    .throw(
                        TypeError,
                        `Expected function as notification handler, got ${invalidValue === null ? "null" : typeof invalidValue}`
                    )
                // If one argument passed:
                expect(() => server.onInternalNotification({"some_notification": invalidValue}))
                    .to
                    .throw(
                        TypeError,
                        `Expected function as notification handler, got ${invalidValue === null ? "null" : typeof invalidValue}`
                    )
            }
        })

        it("Allows to assign multiple handlers for one notification", async () =>
        {
            const {server, client} = await prepareClientAndServer()
            const NOTIFICATION = "rpc.some_notification"
            const notificationTrackers = [new ExternallyResolvablePromise(), new ExternallyResolvablePromise()]
            server.onInternalNotification(NOTIFICATION, notificationTrackers[0].resolve)
            expect(() => server.onInternalNotification(NOTIFICATION, notificationTrackers[1].resolve)).to.not.throw()
            client.send(JSON.stringify({
                jsonrpc: "2.0",
                method: NOTIFICATION
            }))
            return Promise.all(notificationTrackers)
        })

        it("Handler used to handle notifications in any of existing namespaces", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "rpc.testNotification"
            const namespaces = ["namespace1", "namespace2"]
            namespaces.forEach((namespace) => server.createNamespace(namespace))
            const notificationsReceivedFrom = []
            server.onInternalNotification(NOTIFICATION_NAME, (notification, socket, ns) =>
            {
                notificationsReceivedFrom.push(ns.getName().slice(1))
            })

            for (const namespace of namespaces)
            {
                const client = await connectTo({server, path: `/${namespace}`})
                const serverReceivedNotification = new ExternallyResolvablePromise()
                server.onceInternalNotification(NOTIFICATION_NAME, serverReceivedNotification.resolve)
                client.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method: NOTIFICATION_NAME
                }))
                await serverReceivedNotification
            }

            expect(notificationsReceivedFrom).to.have.members(namespaces)
        })

        it("Handler also works fine for namespaces that is added after notification handler assigned", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "rpc.testNotification"
            const namespaces = ["namespace1", "namespace2"]
            namespaces.forEach((namespace) => server.createNamespace(namespace))
            const notificationsReceivedFrom = []
            server.onInternalNotification(NOTIFICATION_NAME, (notification, socket, ns) =>
            {
                notificationsReceivedFrom.push(ns.getName().slice(1))
            })

            // Add additional namespace after notification handler registered:
            const newNamespace = "namespace3"
            namespaces.push(newNamespace)
            server.createNamespace(newNamespace)

            for (const namespace of namespaces)
            {
                const client = await connectTo({server, path: `/${namespace}`})
                const serverReceivedNotification = new ExternallyResolvablePromise()
                server.onceInternalNotification(NOTIFICATION_NAME, serverReceivedNotification.resolve)
                client.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method: NOTIFICATION_NAME
                }))
                await serverReceivedNotification
            }

            expect(notificationsReceivedFrom).to.have.members(namespaces)
        })
    })
}
