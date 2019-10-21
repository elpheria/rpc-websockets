const expect = require("chai").expect
const INVALID_VALUES = require("../../_invalidValues")
const _WebSocketServer = require("../../../dist").Server

module.exports = ({WebSocketServer}) =>
{
    describe(".constructor()", () =>
    {
        it("Allows to not pass any parameters at all", () =>
        {
            expect(() => new WebSocketServer()).to.not.throw()
        })

        it("Starts on random free port if no \"port\" parameter specified", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.port).to.be.equal(0)
        })

        it("Throws an error if \"strict_notifications\" parameter is not boolean value", () =>
        {
            const invalidValues = INVALID_VALUES.BOOLEAN.concat([null])

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        strict_notifications: invalidValue
                    })
                }).to.throw(TypeError, `"strict_notifications" should be boolean, "${invalidValue === null ? "null" : typeof invalidValue}" given`)
            }
        })

        it("\"strict_notifications\" parameter is boolean \"true\" by default", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.strict_notifications).to.be.equal(true)
        })

        it("Throws an error if \"idParam\" is not a string", () =>
        {
            const invalidValues = INVALID_VALUES.STRING.concat([null])

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        idParam: invalidValue
                    })
                }).to.throw(TypeError, `"idParam" should be a string, "${invalidValue === null ? "null" : typeof invalidValue}" given`)
            }
        })

        it("Throws an error if \"idParam\" is an empty string", () =>
        {
            const invalidValues = INVALID_VALUES.STRING__FILLED

            for (const invalidValue of invalidValues)
            {
                expect(() =>
                {
                    new WebSocketServer({
                        idParam: invalidValue
                    })
                }).to.throw(TypeError, "\"idParam\" can not be empty string")
            }
        })

        it("automatically trim leading and trailing spaces around \"idParam\" property", () =>
        {
            const idParam = "  test  "
            const trimmedIdParam = "test"
            const server = new WebSocketServer({idParam})
            expect(server.options.idParam).to.be.equal(trimmedIdParam)
        })

        it("\"idParam\" parameter is \"socket_id\" by default", () =>
        {
            const server = new WebSocketServer()
            expect(server.options.idParam).to.be.equal("socket_id")
        })

        it("Should return a new Server instance", () =>
        {
            const server = new WebSocketServer()
            expect(server).to.be.an.instanceOf(_WebSocketServer)
        })
    })
}
