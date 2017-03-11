/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

const should = require("chai").should()
const expect = require("chai").expect
const WebSocketServer = require("../dist").Server

const Barge = require("../dist").Client
const SERVER_HOST = "localhost"
const SERVER_PORT = 0 // random free port

describe("Client", function()
{
    let server = null,
        port = null

    before(function(done)
    {
        server = runServer(Math.floor(Math.random() * (65536 - 40001) + 40000))
        port = server.wss.options.port

        server.register("greet", function()
        {
            return "Hello, subscriber!"
        })

        server.register("sum", function(args)
        {
            return args[0] + args[1]
        })

        server.register("notification", function()
        {
            return true
        })

        server.register("hang", function()
        {
            return new Promise(function(resolve, reject)
            {
                setTimeout(function() { resolve() }, 3000)
            })
        })

        server.event("newsUpdate")
        server.event("newMessage")

        done()
    })

    after(function(done)
    {
        server.close().then(done)
    })

    it("should return a new instance", function()
    {
        const client = new Barge("ws://localhost:" + port)
        client.should.be.an.instanceOf(Barge)
    })

    describe(".call", function()
    {
        it("should call an RPC method without parameters and receive a valid response", function(done)
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                client.call("greet").then(function(response)
                {
                    response.should.equal("Hello, subscriber!")

                    done()
                    client.close()
                }, function(error)
                {
                    done(error)
                })
            })
        })

        it("should call an RPC method with parameters and receive a valid response", function(done)
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                client.call("sum", [5, 3]).then(function(response)
                {
                    response.should.equal(8)

                    done()
                    client.close()
                }, function(error)
                {
                    done(error)
                })
            })
        })

        it("should throw TypeError if method not provided", function()
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                expect(client.call.bind(client)).to.throw(TypeError)
            })
        })

        it("should correctly throw if nonexistent method called", function()
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                let exception = false

                client.call("nonexistent").then(function()
                {
                    exception = true
                })
                .catch(function(error)
                {
                    expect(error.code).to.exist
                    expect(error.message).to.exist
                })

                expect(exception).to.be.false
            })
        })

        it("should throw Error on reply timeout", function(done)
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                client.call("hang", null, 20).then(function()
                {
                    done(new Error("didn't hang"))
                })
                .catch(function(error)
                {
                    expect(error.message).to.equal("reply timeout")
                    done()
                })
            })
        })
    })

    describe(".notify", function()
    {
        it("should send a notification", function(done)
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                client.notify("notification").then(function()
                {
                    done()
                    client.close()
                }, function(error)
                {
                    done(error)
                })
            })
        })

        it("should throw TypeError if method not provided", function()
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                expect(client.notify.bind(client)).to.throw(TypeError)
            })
        })
    })

    describe(".subscribe", function()
    {
        let client = null

        before(function(done)
        {
            client = new Barge("ws://localhost:" + port)

            client.on("open", done)
        })

        after(function(done)
        {
            client.close()
            done()
        })

        it("should subscribe to an event", function(done)
        {
            client.subscribe("newsUpdate").then(done, function(error)
            {
                done(error)
            })
        })

        it("should throw Error if event is not registered", function()
        {
            client.subscribe("inexistent").catch(function(error)
            {
                error.name.should.equal("Error")
                error.message.should.equal("Failed subscribing to an event with: provided event invalid")
            })
        })

        it("should throw TypeError if event name not provided", function()
        {
            client.subscribe().catch(function(error)
            {
                error.name.should.equal("TypeError")
                error.message.should.equal("\"event\" is required")
            })
        })

        it("should receive an event with no values", function(done)
        {
            server.emit("newsUpdate")

            client.once("newsUpdate", function()
            {
                done()
            })
        })

        it("should receive an event with a single value", function(done)
        {
            server.emit("newsUpdate", "fox")

            client.once("newsUpdate", function(values)
            {
                values.should.equal("fox")
                done()
            })
        })

        it("should receive an event with multiple values", function(done)
        {
            server.emit("newsUpdate", "fox", "mtv", "eurosport")

            client.once("newsUpdate", function(arg1, arg2, arg3)
            {
                arg1.should.equal("fox")
                arg2.should.equal("mtv")
                arg3.should.equal("eurosport")
                done()
            })
        })
    })

    describe(".unsubscribe", function()
    {
        let client = null

        before(function(done)
        {
            client = new Barge("ws://localhost:" + port)

            client.once("open", done)
        })

        after(function(done)
        {
            client.close()
            done()
        })

        it("should unsubscribe from an event", function(done)
        {
            client.subscribe("newsUpdate").then(function()
            {
                client.unsubscribe("newsUpdate").then(done)
            }).catch(function(error)
            {
                done(error)
            })
        })

        it("should throw TypeError if event name not provided", function()
        {
            client.unsubscribe().catch(function(error)
            {
                error.name.should.equal("TypeError")
                error.message.should.equal("\"event\" is required")
            })
        })
    })

    describe(".namespace", function()
    {
        let client = null

        before(function(done)
        {
            client = new Barge("ws://localhost:" + port + "/chat")

            client.on("open", done)
        })

        after(function(done)
        {
            client.close()
            done()
        })

        it("should subscribe to an event", function(done)
        {
            client.subscribe("newMessage").then(done, function(error)
            {
                done(error)
            })
        })

        it("should receive an event from a joined namespace", function(done)
        {
            const chat = server.of("/chat")
            chat.emit("newMessage")

            client.once("newMessage", function()
            {
                done()
            })
        })
    })

    describe(".close", function()
    {
        it("should close a connection gracefully", function(done)
        {
            const client = new Barge("ws://localhost:" + port)

            client.on("open", function()
            {
                client.close()
                done()
            })
        })
    })
})

/** Runs a WebSocket server.
 * @param {Number} port - Listening port
 * @param {Number} host - Hostname
 * @return {WebSocketServer}
 */
function runServer(port, host)
{
    return new WebSocketServer(
        {
            host: host || SERVER_HOST,
            port: port || SERVER_PORT
        })
}
