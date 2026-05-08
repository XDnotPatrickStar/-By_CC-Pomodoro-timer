const { Notification } = require('electron');

function showNotification(title, body) {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, silent: true });
    n.on('click', () => {
      // Will be handled by tray to show window
    });
    n.show();
  }
}

module.exports = { showNotification };
