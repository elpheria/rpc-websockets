module.exports = ({runWebSocketServer}) =>
{
    require("./registerMethod")({runWebSocketServer})
    require("./unregisterMethod")({runWebSocketServer})
    require("./registerInternalMethod")({runWebSocketServer})
    require("./unregisterInternalMethod")({runWebSocketServer})
}
