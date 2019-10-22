const testRegisterNotification = require("./registerNotification")
const testUnregisterNotification = require("./unregisterNotification")
const testGetRegisteredNotifications = require("./getRegisteredNotifications")
const testOnNotification = require("./onNotification")

module.exports = ({runWebSocketServer, connectTo}) =>
{
    testRegisterNotification({runWebSocketServer})
    testUnregisterNotification({runWebSocketServer})
    testGetRegisteredNotifications({runWebSocketServer})
    testOnNotification(({runWebSocketServer, connectTo}))
}
