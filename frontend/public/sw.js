// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received");

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "Multimedia Portal";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    tag: data.tag || "notification",
    requireInteraction: false,
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked");

  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
