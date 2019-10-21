const testCreateNamespace = require("./createNamespace")
const testHasNamespace = require("./hasNamespace")
const testCloseNamespace = require("./closeNamespace")
const testGetNamespace = require("./getNamespace")
const testGetOrCreateNamespace = require("./getOrCreateNamespace")
const testOf = require("./of")

module.exports = ({runWebSocketServer}) =>
{
    testCreateNamespace({runWebSocketServer})
    testHasNamespace({runWebSocketServer})
    testCloseNamespace({runWebSocketServer})
    testGetNamespace({runWebSocketServer})
    testGetOrCreateNamespace({runWebSocketServer})
    testOf({runWebSocketServer})
}
