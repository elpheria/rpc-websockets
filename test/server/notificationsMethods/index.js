module.exports = ({runWebSocketServer, connectTo}) =>
{
    require("./registerNotification")({runWebSocketServer})
    require("./unregisterNotification")({runWebSocketServer})
    require("./getRegisteredNotifications")({runWebSocketServer})
    require("./onNotification")({runWebSocketServer, connectTo})
    require("./onceNotification")({runWebSocketServer, connectTo})
    require("./offNotification")({runWebSocketServer, connectTo})
    require("./sendNotification")({runWebSocketServer, connectTo})
}
