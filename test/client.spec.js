/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const should = require("chai").should()
const expect = require("chai").expect
const WebSocketServer = require("../dist/index.cjs").Server

const WebSocket = require("../dist/index.cjs").Client
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
                host = server.wss.options.host
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

                server.register("cryptic", function()
                {
                    return "boohoo"
                }).protected()

                server.register("hang", function()
                {
                    return new Promise(function(resolve, reject)
                    {
                        try
                        {
                            setTimeout(function() { resolve() }, 3000)
                        }
                        catch (e)
                        {
                            reject(e)
                        }
                    })
                })

                server.setAuth(function(data)
                {
                    if (data.username === "foo" && data.password === "bar")
                        return true
                    else
                        return false
                })

                server.event("newsUpdate")
                server.event("newMessage")
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

    describe(".connect", function()
    {
        it("should explicitly connect to server", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port, { autoconnect: false })
            client.should.be.an.instanceOf(WebSocket)

            client.connect()
            client.on("open", done)
        })
    })

    it("should get registered methods from server", function(done)
    {
        const client = new WebSocket("ws://" + host + ":" + port)
        client.should.be.an.instanceOf(WebSocket)

        client.on("open", function()
        {
            client.listMethods().then(function(response)
            {
                response.should.be.an.instanceOf(Array)
                done()
                client.close()
            })
        })
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

        it("should call a protected RPC method and receive an error", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.call("cryptic")
                    .then(function(response)
                    {
                        expect(response.code).to.exist
                        expect(response.message).to.exist
                        done(new Error("should not be authorized to run this method"))
                        client.close()
                    }, function(error)
                    {
                        expect(error.code).to.exist
                        expect(error.message).to.exist
                        expect(error.code).to.equal(-32605)
                        expect(error.message).to.equal("Method forbidden")
                        done()
                    })
            })

            client.on("error", (error) => console.log(error))
        })

        it("should call a protected RPC method and receive a response", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.login({
                    username: "foo",
                    password: "bar"
                }).then(function()
                {
                    client.call("cryptic").then(function(response)
                    {
                        response.should.equal("boohoo")
                        done()
                        client.close()
                    }, function(error)
                    {
                        done(error)
                    })
                })
            })

            client.on("error", (error) => console.log(error))
        })
    })

    describe(".login", function()
    {
        it("should throw if wrong credentials were provided", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                client.login({
                    username: "fooz",
                    password: "barz"
                }).catch(function(error)
                {
                    expect(error).to.be.an("Error")
                    expect(error.message).to.equal("authentication failed")
                    done()
                })
            })
        })

        it("should succeed if correct credentials were provided", function(done)
        {
            const client = new WebSocket("ws://" + host + ":" + port)

            client.on("open", function()
            {
                try
                {
                    client.login({
                        username: "foo",
                        password: "bar"
                    }).then(function(response)
                    {
                        expect(response).to.be.true
                        done()
                        client.close()
                    }).catch(function(err)
                    {
                        console.log(err)
                        done(err)
                        client.close()
                    })
                }
                catch (error)
                {
                    throw new Error(error)
                }
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
    })

    describe(".subscribe", function()
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

        it("should subscribe to an event", function(done)
        {
            client.subscribe("newsUpdate").then(function(data)
            {
                data.should.have.property("newsUpdate")
                data.newsUpdate.should.equal("ok")
                done()
            }).catch(function(error)
            {
                done(error)
            })
        })

        it("should subscribe to multiple events", function(done)
        {
            client.subscribe([ "newsUpdate", "orderUpdate" ]).then(function(data)
            {
                data.should.have.property("newsUpdate")
                data.should.have.property("orderUpdate")
                done()
            }).catch(function(error)
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

        it("should throw an error if event name not provided", function()
        {
            client.subscribe().catch(function(error)
            {
                error.code.should.equal(-32000)
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
                client.unsubscribe("newsUpdate").then(function(data)
                {
                    data.should.have.property("newsUpdate")
                    data.newsUpdate.should.equal("ok")
                    done()
                })
            }).catch(function(error)
            {
                done(error)
            })
        })

        it("should unsubscribe from multiple events", function(done)
        {
            client.subscribe([ "newsUpdate", "orderUpdate" ]).then(function()
            {
                client.unsubscribe([ "newsUpdate", "orderUpdate" ]).then(function(data)
                {
                    data.should.have.property("newsUpdate")
                    data.newsUpdate.should.equal("ok")
                    done()
                })
            }).catch(function(error)
            {
                done(error)
            })
        })

        it("should throw an error if event name not provided", function()
        {
            client.unsubscribe().catch(function(error)
            {
                error.code.should.equal(-32000)
                error.message.should.equal("Event not provided")
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
            client.subscribe("newMessage").then(function(data)
            {
                data.should.have.property("newMessage")
                data.newMessage.should.equal("ok")
                done()
            }).catch(function(error)
            {
                done(error)
            })
        })

        it("should subscribe to multiple events", function(done)
        {
            client.subscribe([ "newsUpdate", "orderUpdate" ]).then(function(data)
            {
                data.should.have.property("newsUpdate")
                data.should.have.property("orderUpdate")
                done()
            }).catch(function(error)
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

        it("should receive params from an event correctly", function(done)
        {
            const ns = server.of("/test")
            ns.event("test")

            var client = new WebSocket("ws://" + host + ":" + port + "/test")

            client.on("open", function()
            {
                client.subscribe("test").then(function ()
                {
                    client.on("test", function (...args)
                    {
                        args.should.eql(["aaaa", "bbbb", "cccc"])
                        client.close()
                        done()
                    })

                    ns.emit("test", "aaaa", "bbbb", "cccc")
                })
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
        try
        {
            const wss = new WebSocketServer(
                {
                    host: host || SERVER_HOST,
                    port: port || SERVER_PORT
                })
            wss.on("listening", () => resolve(wss))
        }
        catch (error)
        {
            reject(error)
        }
    })
}
