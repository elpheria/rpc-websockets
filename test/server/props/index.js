const expect = require("chai").expect
const WebSocket = require("ws")

module.exports = ({WebSocketServer}) =>
{
    describe(".wss", () =>
    {
        it("contains instance of websocket server from \"ws\" library", () =>
        {
            const server = new WebSocketServer()
            expect(server.wss).to.be.an.instanceOf(WebSocket.Server)
        })
    })
}