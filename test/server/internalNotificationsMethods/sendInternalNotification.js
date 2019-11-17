const expect = require("chai").expect
const spy = require("chai").spy
const INVALID_VALUES = require("../../_invalidValues")
const ExternallyResolvablePromise = require("../../__helpers__/ExternallyResolvalePromise")

module.exports = ({runWebSocketServer, connectTo}) =>
{
    /**
     * Prepare client and server to work together
     * @returns {Promise}
     */
    async function prepareClientAndServer({serverOptions = {}} = {})
    {
        const server = await runWebSocketServer(serverOptions)
        const serverGotConnection = new ExternallyResolvablePromise()
        server.on("RPCConnection", serverGotConnection.resolve)
        const client = connectTo({server})
        return Promise
            .all([serverGotConnection, client])
            .then(([, client]) => ({server, client}))
    }

    describe(".sendInternalNotification()", () =>
    {
        it("Expects notification name to be passed in first argument and notification parameters to be passed in second", async () =>
        {
            const {server, client} = await prepareClientAndServer({
                serverOptions: {
                    strict_notifications: false
                }
            })
            const NOTIFICATION_NAME = "rpc.testNotification"
            const params = {someParam: "someValue"}
            const receivedMessage = await new Promise((resolve) =>
            {
                client.on("message", resolve)
                server.sendInternalNotification(NOTIFICATION_NAME, params)
            })

            expect(JSON.parse(receivedMessage)).to.be.deep.equal({
                jsonrpc: "2.0",
                method: NOTIFICATION_NAME,
                params
            })
        })

        it("Allows to not pass parameters at all", async () =>
        {
            const {server, client} = await prepareClientAndServer({
                serverOptions: {
                    strict_notifications: false
                }
            })
            const NOTIFICATION_NAME = "rpc.testNotification"
            const paramsVariants = [null, undefined]
            for (const params of paramsVariants)
            {
                const receivedMessage = await new Promise((resolve) =>
                {
                    client.on("message", resolve)
                    server.sendInternalNotification(NOTIFICATION_NAME, params)
                })

                expect(JSON.parse(receivedMessage)).to.be.deep.equal({
                    jsonrpc: "2.0",
                    method: NOTIFICATION_NAME
                })
            }
        })

        it("Throws an error if notification name is not a string", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNotificationNames = INVALID_VALUES.STRING
            for (const invalidName of invalidNotificationNames)
            {
                const error = await server.sendInternalNotification(invalidName).catch((e) => e)
                expect(error).to.be.instanceOf(TypeError)
                expect(error.message).to.be.equal(`Notification name should be a string, ${invalidName === null ? "null" : typeof invalidName} passed`)
            }
        })

        it("Throws an error if notification name is empty", async () =>
        {
            const server = await runWebSocketServer()
            const invalidNotificationNames = INVALID_VALUES.STRING__FILLED
            for (const invalidName of invalidNotificationNames)
            {
                const error = await server.sendInternalNotification(invalidName).catch((e) => e)
                expect(error).to.be.instanceOf(Error)
                expect(error.message).to.be.equal("Given notification name is empty")
            }
        })

        it("Automatically adds 'rpc.' prefix to notification name", async () =>
        {
            const {server, client} = await prepareClientAndServer({
                serverOptions: {
                    strict_notifications: false
                }
            })
            const NOTIFICATION_NAME = "testNotification"
            const params = {someParam: "someValue"}
            const receivedMessage = await new Promise((resolve) =>
            {
                client.on("message", resolve)
                server.sendInternalNotification(NOTIFICATION_NAME, params)
            })

            expect(JSON.parse(receivedMessage)).to.be.deep.equal({
                jsonrpc: "2.0",
                method: `rpc.${NOTIFICATION_NAME}`,
                params
            })
        })

        it("Throws an error if invalid notification parameters are passed", async () =>
        {
            const {server} = await prepareClientAndServer({
                serverOptions: {
                    strict_notifications: false
                }
            })
            const invalidValues = INVALID_VALUES.ALL_INVALID.filter((value) =>
            {
                // exclude array and object because they are valid:
                if (Array.isArray(value)) return false
                if (value && typeof value === "object") return false
                return true
            })
            for (const invalidValue of invalidValues)
            {
                const result = await server
                    .sendInternalNotification("some_notification", invalidValue)
                    .catch((e) => e)
                // if two arguments passed:
                expect(result).to.be.instanceOf(Error)
                expect(result.message).to.be.equal(`Request parameters must be a structured value (an array or an object), "${invalidValue === null ? "null" : typeof invalidValue}" given`)
            }
        })

        it("Sends notification to all existing namespaces", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "testNotification"
            const namespacesNames = ["namespace1", "namespace2"]
            const namespaces = namespacesNames.map((namespaceName) =>
            {
                const namespace = server.createNamespace(namespaceName)
                namespace.sendInternalNotification = spy()
                return namespace
            })
            await server.sendInternalNotification(NOTIFICATION_NAME)
            namespaces.forEach((namespace) =>
            {
                expect(namespace.sendInternalNotification).to.have.been.called.with(NOTIFICATION_NAME)
            })
        })

        it("Resolves once all notifications are sent", async () =>
        {
            const server = await runWebSocketServer()
            const NOTIFICATION_NAME = "notification"
            const namespacesNames = ["namespace1", "namespace2"]
            let sentNotifications = 0
            namespacesNames.forEach((namespaceName) =>
            {
                const namespace = server.createNamespace(namespaceName)
                namespace.sendInternalNotification = async () =>
                {
                    // Simulate delay to ensure that server.sendNotification() will not
                    // be resolved before this method:
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    sentNotifications++
                }
            })
            await server.sendInternalNotification(NOTIFICATION_NAME)
            expect(sentNotifications).to.be.equal(namespacesNames.length)
        })
    })
}
