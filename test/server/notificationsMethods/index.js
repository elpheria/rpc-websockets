const testRegisterNotification = require("./registerNotification")
const testUnregisterNotification = require("./unregisterNotification")
const testGetRegisteredNotifications = require("./getRegisteredNotifications")
const testOnNotification = require("./onNotification")
const testOnceNotification = require("./onceNotification")

module.exports = ({runWebSocketServer, connectTo}) =>
{
    testRegisterNotification({runWebSocketServer})
    testUnregisterNotification({runWebSocketServer})
    testGetRegisteredNotifications({runWebSocketServer})
    testOnNotification(({runWebSocketServer, connectTo}))
    testOnceNotification(({runWebSocketServer, connectTo}))
}
