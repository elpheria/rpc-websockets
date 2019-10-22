const testRegisterNotification = require("./registerNotification")
const testUnregisterNotification = require("./unregisterNotification")
const testGetRegisteredNotifications = require("./getRegisteredNotifications")

module.exports = ({runWebSocketServer}) =>
{
    testRegisterNotification({runWebSocketServer})
    testUnregisterNotification({runWebSocketServer})
    testGetRegisteredNotifications({runWebSocketServer})
}
