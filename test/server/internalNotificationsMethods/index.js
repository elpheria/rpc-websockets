module.exports = ({runWebSocketServer, connectTo}) =>
{
    require("./registerInternalNotification")({runWebSocketServer})
    require("./unregisterInternalNotification")({runWebSocketServer})
    require("./getRegisteredInternalNotifications")({runWebSocketServer})
    require("./onInternalNotification")({runWebSocketServer, connectTo})
    require("./onceInternalNotification")({runWebSocketServer, connectTo})
    require("./offInternalNotification")({runWebSocketServer, connectTo})
    require("./sendInternalNotification")({runWebSocketServer, connectTo})
}
