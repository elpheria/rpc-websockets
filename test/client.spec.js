/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

const should = require("chai").should()
const expect = require("chai").expect
const WebSocketServer = require("../dist").Server

const WebSocket = require("../dist").Client
const SERVER_HOST = "localhost"
const SERVER_PORT = 0 // random free port

describe("Client", function()
{
    let server = null, host = null, port = null

    before(function(done)
    {
        runServer(Math.floor(Math.random() * (65536 - 40001) + 40000))
            .then((srv) =>
            {
                server = srv
                host = server.wss.httpServer.address().address
                port = server.wss.httpServer.address().port

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

                server.register("circular", function()
                {
                    const Obj = function()
                    {
                        this.one = "one"
                        this.two = "two"
                        this.ref = this
                    }

                    return new Obj()
                })

                server.event("newsUpdate")
                server.event("newMessage")
                server.event("circularUpdate")
                server.event("newMessage", "/chat")
                server.event("chatMessage", "/chat")

                done()
            })
    })

    after(function(done)
    {
        server.close().then(done)
    })

    it("should return a new instance", function()
    {
        const client = new WebSocket("ws://" + host + ":" + port)
        client.should.be.an.instanceOf(WebSocket)
    })

    describe(".call", function()
    {
        it("should call an RPC method without parameters and receive a valid response", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

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

            client.on("error", (error) => console.log(error))
        })

        it("should call an RPC method with parameters and receive a valid response", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

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

        it("should call an RPC method and receive a valid response when RPC method returns a circular object", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.call("circular").then(function(response)
                {
                    response.should.deep.equal({
                        one: "one",
                        two: "two",
                        ref: response
                    })

                    done()
                    client.close()
                }, function(error)
                {
                    done(error)
                })
            })
        })

        it("should forward ws options to ws.send", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.call("greet", {}, { binary: true }).then(function(response)
                {
                    response.should.equal("Hello, subscriber!")

                    done()
                    client.close()
                }, function(error)
                {
                    done(error)
                })
            })

            client.on("error", (error) => console.log(error))
        })

        it("should throw TypeError if method not provided", function()
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                expect(client.call.bind(client)).to.throw(TypeError)
            })
        })

        it("should correctly throw if nonexistent method called", function()
        {
            const client = new WebSocket("ws://" + host + ":" + port)

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
            const client = new WebSocket("ws://" + host + ":" + port)

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
            const client = new WebSocket("ws://" + host + ":" + port)

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
            const client = new WebSocket("ws://" + host + ":" + port)

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
            client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.subscribe("circularUpdate")
                done()
            })
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
                error.message.should.equal("Failed subscribing to an event 'inexistent' with: provided event invalid")
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

        it("should receive an event with a single object value", function(done)
        {
            server.emit("newsUpdate", { foo: "bar", boo: "baz" })

            client.once("newsUpdate", function(obj)
            {
                obj.should.be.an.instanceOf(Object)
                expect(obj).to.deep.equal({ foo: "bar", boo: "baz" })
                done()
            })
        })

        it("should receive an event with circular object", function(done)
        {
            const Obj = function()
            {
                this.one = "one"
                this.two = "two"
                this.ref = this
            }

            server.emit("circularUpdate", new Obj())

            client.on("circularUpdate", function(value)
            {
                value.should.deep.equal({
                    one: "one",
                    two: "two",
                    ref: value
                })
            })
        })
    })

    describe(".unsubscribe", function()
    {
        let client = null

        before(function(done)
        {
            client = new WebSocket("ws://" + host + ":" + port)

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
            client = new WebSocket("ws://" + host + ":" + port + "/chat")

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
            chat.emit("chatMessage")

            client.once("chatMessage", function()
            {
                done()
            })
        })
    })

    describe(".close", function()
    {
        it("should close a connection gracefully", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

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
    return new Promise((resolve, reject) =>
    {
        const wss = new WebSocketServer(
            {
                host: host || SERVER_HOST,
                port: port || SERVER_PORT
            })

        wss.on("listening", () => resolve(wss))
    })
}
