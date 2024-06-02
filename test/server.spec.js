/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable brace-style */
/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

const should = require("chai").should()
const expect = require("chai").expect
const WebSocket = require("ws")

const WebSocketServer = require("../dist/index.cjs").Server
const SERVER_HOST = "localhost"
const SERVER_PORT = 0 // random free port
let rpc_id = 1

describe("Server", function()
{
    it("should return a new instance", function(done)
    {
        getInstance().then((server) =>
        {
            server.should.be.an.instanceOf(WebSocketServer)

            server.close().then(done)
        })
    })

    it("should forward throw an error from 'ws' if no params object is passed", function()
    {
        let exception = false

        try { new WebSocketServer() }

        catch (error) { exception = true }

        exception.should.be.ok
    })

    it(".register", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try { server.register("foo", function() {}) }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".register.protected", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try
            {
                server.register("foo", function() {}).protected()
            }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".register.public", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try
            {
                server.register("foo", function() {}).public()
            }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".setAuth", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try
            {
                server.setAuth(function() {})
            }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".event", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try { server.event("foo") }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".event.protected", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try { server.event("foo").protected() }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".event.public", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try { server.event("foo").public }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".eventList", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            server.event("newMail")

            try { expect(server.eventList()).to.be.an("array").and.to.include("newMail") }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".emit", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            server.event("foo")

            try { server.emit("foo") }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".namespace", function()
    {
        getInstance().then((server) =>
        {
            const ns = server.of("/chatroom")

            ns.should.be.an("object")
            expect(ns.emit).to.be.a("function")
            expect(ns.name).to.be.a("string")
            expect(ns.connected).to.be.a("function")
            expect(ns.clients).to.be.a("function")
        })
    })

    it(".namespaceMethod", function(done)
    {
        getInstance(Math.floor(Math.random() * (65536 - 40001) + 40000)).then((server) =>
        {
            server.register("sendMsg", () => "Message received", "/chatroom")

            connect(
                server.wss.options.port,
                server.wss.options.host,
                "/chatroom")
                .then((ws) =>
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "sendMsg",
                        params: ["Hello, everyone!"]
                    }))

                    ws.once("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal("Message received")

                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
                .catch((error) => done(error))
        })
    })

    it(".namespaceList", function()
    {
        getInstance().then((server) =>
        {
            const ns = server.of("/chat1")

            ns.event("alert1")
            expect(ns.eventList).to.have.lengthOf(1)

            server.event("alert2", "/chat2")
            expect(ns.eventList).to.have.lengthOf(1)

            expect(server.eventList()).to.have.lengthOf(0)
        })
    })

    it(".closeNamespace", function(done)
    {
        getInstance().then((server) =>
        {
            const ns = server.of("/chat1")

            ns.event("alert1")
            expect(ns.eventList).to.have.lengthOf(1)

            server.event("alert2", "/chat2")
            expect(ns.eventList).to.have.lengthOf(1)

            server.closeNamespace("/chat1")
            expect(server.namespaces["/chat1"]).to.be.undefined
            done()
        })
    })

    it(".createError", function()
    {
        let exception = false

        getInstance().then((server) =>
        {
            try { server.createError(-32050, "Error", "Error details") }

            catch (error) { exception = true }

            server.close().then(function()
            {
                exception.should.be.false
            })
        })
    })

    it(".close", function(done)
    {
        getInstance().then((server) =>
        {
            server.close().then(done, function(error)
            {
                done(error)
            })
        })
    })

    describe("WebSocket API", function()
    {
        let server = null
        let host = null
        let port = null

        // create server and register testing methods
        before(function(done)
        {
            getInstance(Math.floor(Math.random() * (65536 - 40001) + 40000)).then((inst) =>
            {
                server = inst
                host = server.wss.options.host
                port = server.wss.options.port

                let auth_id = null

                inst.setAuth(function(data, socket_id)
                {
                    if (data.username === "foo" && data.password === "bar")
                    {
                        auth_id = socket_id
                        return true
                    }
                    else
                        return false
                })

                inst.register("sqrt", function(param)
                {
                    return Math.sqrt(param)
                })

                inst.register("sqrt_protected", function(param, socket_id)
                {
                    if(auth_id !== socket_id) throw "Socket ID does not match!";
                    return Math.sqrt(param)
                }).protected()

                inst.register("sum", function(params)
                {
                    let sum = 0

                    for (const nr of params)
                    {
                        sum += nr
                    }

                    return sum
                })

                inst.register("subtract", function(params)
                {
                    if (Array.isArray(params))
                        return params[0] - params[1]

                    if (typeof (params) === "object")
                        return params.minuend - params.subtrahend
                })

                inst.register("greet", function(name)
                {
                    return "Hello, " + name + "!"
                })

                inst.register("update", function()
                {
                    return
                })

                inst.register("throwsSrvError", function()
                {
                    throw inst.createError(-32050, "Server error", "Server error details")
                })

                inst.register("throwsJsError", function()
                {
                    throw new Error("Server error details")
                })

                inst.event("newMail")
                inst.event("updatedNews")


                done()
            })
        })

        // close server
        after(function(done)
        {
            server.close().then(done, function(error)
            {
                done(error)
            })
        })

        describe("# connection", function()
        {
            it("should connect client with a custom socket id", function(done)
            {
                connect(port, host, "/custom", "?socket_id=foo").then((ws) =>
                {
                    expect(server.of("/custom").connected().foo).not.to.be.undefined
                    done()
                })
            })
        })

        describe("# single rpc request", function()
        {
            it("should return a valid response using single parameter", function(done)
            {
                connect(port, host).then((ws) =>
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "sqrt",
                        params: [4]
                    }))

                    ws.once("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(2)

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should return a valid response using positional parameters", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "subtract",
                        params: [42, 23]
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(19)

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should return a valid response using named parameters", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "subtract",
                        params:
                        {
                            subtrahend: 23,
                            minuend: 42
                        }
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(19)

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32601 when calling a missing method", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "power",
                        params: [4]
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32601)
                        message.error.message.should.equal("Method not found")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32700 when called with invalid JSON", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    const data = "{\"jsonrpc\": \"2.0\", \"foo}"
                    ws.send(data)

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.error.code.should.equal(-32700)
                        message.error.message.should.equal("Parse error")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when request data is null", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    const data = "null"
                    ws.send(data)

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.error.code.should.equal(-32600)
                        message.error.message.should.equal("Invalid Request")

                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when called with invalid method name in JSON-RPC 2.0 Request object", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: 1,
                        params: "foo"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32600)
                        message.error.message.should.equal("Invalid Request")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when called with invalid params type in JSON-RPC 2.0 Request object", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "foo",
                        params: "foo"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32600)
                        message.error.message.should.equal("Invalid Request")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should return a valid error if callback threw with .error", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "throwsSrvError"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32050)
                        message.error.message.should.equal("Server error")
                        message.error.data.should.equal("Server error details")

                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should return a valid error if callback threw with JavaScript's Error", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "throwsJsError"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32000)
                        message.error.message.should.equal("Error")
                        message.error.data.should.equal("Server error details")

                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })
        })

        describe("# batch rpc request", function()
        {
            it("should return a valid response", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify([
                        {
                            id: rpc_id,
                            jsonrpc: "2.0",
                            method: "greet",
                            params: ["Charles"]
                        },
                        {
                            id: ++rpc_id,
                            jsonrpc: "2.0",
                            method: "sum",
                            params: [1, 2, 4]
                        },
                        {
                            id: ++rpc_id,
                            jsonrpc: "2.0",
                            method: "subtract",
                            params: [50, 29]
                        }]))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        expect(message).to.deep.equal([
                            {
                                jsonrpc: "2.0",
                                result: "Hello, Charles!",
                                id: 8
                            },
                            {
                                jsonrpc: "2.0",
                                result: 7,
                                id: 9
                            },
                            {
                                jsonrpc: "2.0",
                                result: 21,
                                id: 10
                            }])

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32700 when called with invalid JSON", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    const data =
                        "[{\"jsonrpc\": \"2.0\", \"method\": \"sum\", \"params\": [1,2,4], \"id\": \"1\"}, " +
                        "{\"jsonrpc\": \"2.0\", \"method\""

                    ws.send(data)

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.error.code.should.equal(-32700)
                        message.error.message.should.equal("Parse error")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when called with an empty array", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send("[]")

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.error.code.should.equal(-32600)
                        message.error.message.should.equal("Invalid Request")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when called with invalid non-empty array", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send("[1]")

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.should.be.an("array")
                        message[0].error.code.should.equal(-32600)
                        message[0].error.message.should.equal("Invalid Request")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32600 when called with invalid data", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send("[1,2,3]")

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.should.be.an("array")
                        message[0].error.code.should.equal(-32600)
                        message[0].error.message.should.equal("Invalid Request")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should receive all notifications", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify([
                        {
                            jsonrpc: "2.0",
                            method: "greet",
                            params: "Charles"
                        },
                        {
                            jsonrpc: "2.0",
                            method: "sum",
                            params: [1, 2, 4]
                        },
                        {
                            jsonrpc: "2.0",
                            method: "subtract",
                            params: [50, 29]
                        }]), done)

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })
        })

        describe("# notification", function()
        {
            it("should receive a notification", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        jsonrpc: "2.0",
                        method: "update"
                    }), function()
                    {
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                }).catch(function(error)
                {
                    console.log("UNHANDLED", error)
                })
            })
        })

        describe("# event", function()
        {
            it("should respond with -32000 if event name not provided", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.error.code.should.equal(-32000)
                        message.error.message.should.equal("Event not provided")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should subscribe a user to an event", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on",
                        params: ["newMail"]
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.newMail.should.equal("ok")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should emit an event with no values to subscribed clients", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on",
                        params: ["newMail"]
                    }))

                    ws.on("message", function(message)
                    {
                        try { message = JSON.parse(message) }

                        catch (error) { done(error) }

                        if (message.notification)
                        {
                            message.notification.should.equal("newMail")

                            ws.close()
                            return done()
                        }

                        if (message.result.newMail === "ok")
                            return server.emit("newMail")
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should emit an event with single value to subscribed clients", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on",
                        params: ["updatedNews"]
                    }))

                    ws.on("message", function(message)
                    {
                        try { message = JSON.parse(message) }

                        catch (error) { done(error) }

                        if (message.notification)
                        {
                            message.notification.should.equal("updatedNews")
                            message.params[0].should.equal("fox")

                            ws.close()
                            return done()
                        }

                        if (message.result.updatedNews === "ok")
                            return server.emit("updatedNews", "fox")
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should emit an event with multiple values to subscribed clients", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on",
                        params: ["updatedNews"]
                    }))

                    ws.on("message", function(message)
                    {
                        try { message = JSON.parse(message) }

                        catch (error) { done(error) }

                        if (message.notification)
                        {
                            message.notification.should.equal("updatedNews")
                            expect(message.params).to.deep.equal(["fox", "mtv", "eurosport"])

                            ws.close()
                            return done()
                        }

                        if (message.result.updatedNews === "ok")
                            return server.emit("updatedNews", "fox", "mtv", "eurosport")
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should unsubscribe a user from an event", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.on",
                        params: ["newMail"]
                    }))

                    let subscribed = false

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        if (message.result.newMail === "ok" && subscribed === false)
                        {
                            subscribed = true

                            return ws.send(JSON.stringify({
                                id: ++rpc_id,
                                jsonrpc: "2.0",
                                method: "rpc.off",
                                params: ["newMail"]
                            }))
                        }

                        message.id.should.equal(rpc_id)
                        message.result.newMail.should.equal("ok")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })
        })

        describe("# login", function()
        {
            it("should respond with -32604 if params not provided", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.login"
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32604)
                        message.error.message.should.equal("Params not found")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with false if login failed", function(done)
            {
                connect(port, host).then(function(ws)
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.login",
                        params: {
                            username: "foo",
                            password: "bar2"
                        }
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(false)

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with -32605 when called without being authorized", function(done)
            {
                connect(port, host).then((ws) =>
                {
                    ws.send(JSON.stringify({
                        id: rpc_id,
                        jsonrpc: "2.0",
                        method: "sqrt_protected",
                        params: [4]
                    }))

                    ws.once("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.error.code.should.equal(-32605)
                        message.error.message.should.equal("Method forbidden")

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should respond with true if login successful", function(done)
            {
                connect(port, host).then((ws) =>
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.login",
                        params: {
                            username: "foo",
                            password: "bar"
                        }
                    }))

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(true)

                        rpc_id++
                        ws.close()
                        done()
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })

            it("should return a valid response if authorized", function(done)
            {
                connect(port, host).then((ws) =>
                {
                    ws.send(JSON.stringify({
                        id: ++rpc_id,
                        jsonrpc: "2.0",
                        method: "rpc.login",
                        params: {
                            username: "foo",
                            password: "bar"
                        }
                    }))

                    ws.once("message", function(message)
                    {
                        message = JSON.parse(message)

                        message.id.should.equal(rpc_id)
                        message.result.should.equal(true)

                        ws.send(JSON.stringify({
                            id: ++rpc_id,
                            jsonrpc: "2.0",
                            method: "sqrt_protected",
                            params: [4]
                        }))

                        ws.once("message", function(message)
                        {
                            message = JSON.parse(message)

                            message.id.should.equal(rpc_id)
                            message.result.should.equal(Math.sqrt(4))

                            rpc_id++
                            disconnect(ws).then(done())
                        })
                    })

                    ws.once("error", function(error)
                    {
                        done(error)
                    })
                })
            })
        })
    })
})

/**
 * Returns a new WebSocketServer instance.
 * @param {Number} port - port number
 * @param {String} host - hostname
 * @return {WebSocketServer}
 */
function getInstance(port, host)
{
    return new Promise((resolve, reject) =>
    {
        const wss = new WebSocketServer({
            host: host || SERVER_HOST,
            port: port || SERVER_PORT
        })

        wss.on("listening", () => resolve(wss))
        wss.on("error", (error) => reject(error))
    })
}

/**
 * Connects to an RPC server.
 * @param {Number} port - port number
 * @param {String} host - hostname
 * @param {String} path - uri path
 * @param {String} query - uri query
 * @return {Promise}
 */
function connect(port, host, path, query)
{
    return new Promise((resolve, reject) =>
    {
        const client = new WebSocket("ws://" + (host || SERVER_HOST) +
            ":" + (port || SERVER_PORT) + (path || "/") + (query || ""))

        client.on("open", () => resolve(client))
        client.on("error", (error) => reject(error))
    })
}

/**
 * Disconnects from an RPC server.
 * @param {Object} client - Client instance
 * @return {Promise}
 */
function disconnect(client)
{
    return new Promise(function(resolve, reject)
    {
        try {
            client.close()
        }
        catch (error) {
            reject(error)
        }
        resolve()
    })
}
