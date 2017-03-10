/* eslint no-unused-vars: "off" */
/* eslint max-len: "off" */

"use strict"

const should = require("chai").should()
const expect = require("chai").expect
const WebSocket = require("ws")

const Pharos = require("../dist").Server
const SERVER_HOST = "localhost"
const SERVER_PORT = 0 // random free port
let rpc_id = 1

describe("Server", function()
{
    it("should return a new instance", function(done)
    {
        const server = getInstance()

        server.should.be.an.instanceOf(Pharos)

        server.close().then(done)
    })

    it("should forward throw an error from 'ws' if no params object is passed", function()
    {
        let exception = false

        try { new Pharos() }

        catch (error) { exception = true }

        exception.should.be.ok
    })

    it(".register", function()
    {
        let exception = false
        const server = getInstance()

        try { server.register("foo", function() {}) }

        catch (error) { exception = true }

        server.close().then(function()
        {
            exception.should.be.false
        })
    })

    it(".event", function()
    {
        let exception = false
        const server = getInstance()

        try { server.event("foo") }

        catch (error) { exception = true }

        server.close().then(function()
        {
            exception.should.be.false
        })
    })

    it(".eventList", function()
    {
        let exception = false
        const server = getInstance()
        server.event("newMail")

        try { expect(server.eventList).to.be.an("array").and.to.include("newMail") }

        catch (error) { exception = true }

        server.close().then(function()
        {
            exception.should.be.false
        })
    })

    it(".emit", function()
    {
        let exception = false
        const server = getInstance()
        server.event("foo")

        try { server.emit("foo") }

        catch (error) { exception = true }

        server.close().then(function()
        {
            exception.should.be.false
        })
    })

    it(".createError", function()
    {
        let exception = false
        const server = getInstance()

        try { server.createError(-32050, "Error", "Error details") }

        catch (error) { exception = true }

        server.close().then(function()
        {
            exception.should.be.false
        })
    })

    it(".close", function(done)
    {
        const server = getInstance()

        server.close().then(done, function(error)
        {
            done(error)
        })
    })

    describe("WebSocket API", function()
    {
        let server = null

        // create server and register testing methods
        before(function(done)
        {
            server = getInstance(Math.floor(Math.random() * (65536 - 40001) + 40000))

            server.once("listening", done)

            server.register("sqrt", function(param)
            {
                return Math.sqrt(param)
            })

            server.register("sum", function(params)
            {
                let sum = 0

                for (const nr of params)
                {
                    sum += nr
                }

                return sum
            })

            server.register("subtract", function(params)
            {
                if (Array.isArray(params))
                    return params[0] - params[1]

                if (typeof (params) === "object")
                    return params.minuend - params.subtrahend
            })

            server.register("greet", function(name)
            {
                return "Hello, " + name + "!"
            })

            server.register("update", function()
            {
                return
            })

            server.register("throwsSrvError", function()
            {
                throw server.createError(-32050, "Server error", "Server error details")
            })

            server.register("throwsJsError", function()
            {
                throw new Error("Server error details")
            })

            server.event("newMail")
            server.event("updatedNews")
        })

        // close server
        after(function(done)
        {
            server.close().then(done, function(error)
            {
                done(error)
            })
        })

        describe("# single rpc request", function()
        {
            it("should return a valid response using single parameter", function(done)
            {
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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

            it("should respond with -32600 when called with invalid method name in JSON-RPC 2.0 Request object", function(done)
            {
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
                {
                    ws.send("[1]")

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.should.be.an.array
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
                connect(server.wss.options.port).then(function(ws)
                {
                    ws.send("[1,2,3]")

                    ws.on("message", function(message)
                    {
                        message = JSON.parse(message)
                        message.should.be.an.array
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                })
                .catch(function(error)
                {
                    console.log("UNHANDLED", error)
                })
            })
        })

        describe("# event", function()
        {
            it("should respond with -32000 if event name not provided", function(done)
            {
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                connect(server.wss.options.port).then(function(ws)
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
                            done()
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
                connect(server.wss.options.port).then(function(ws)
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
                            done()
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
                connect(server.wss.options.port).then(function(ws)
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
                            done()
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
                connect(server.wss.options.port).then(function(ws)
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
    })
})

/**
 * Returns a new Pharos instance.
 * @param {Number} port - port number
 * @param {String} host - hostname
 * @return {Pharos}
 */
function getInstance(port, host)
{
    return new Pharos({
        host: host || SERVER_HOST,
        port: port || SERVER_PORT
    })
}

/**
 * Connects to an RPC server.
 * @param {Number} port - port number
 * @param {String} host - hostname
 * @return {Promise}
 */
function connect(port, host)
{
    return new Promise(function(resolve, reject)
    {
        const ws = new WebSocket("ws://" + (host || SERVER_HOST) +
            ":" + (port || SERVER_PORT))

        ws.once("open", function()
        {
            resolve(ws)
        })

        ws.once("error", function(error)
        {
            reject(error)
        })

        ws.once("closed", function()
        {
            reject(new Error("connection abruptly closed"))
        })
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
        client.close()
        resolve()
    })
}
