"use client";

import { useState, useEffect } from "react";
import { useToast } from "./use-toast";

interface PushNotificationOptions {
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export function usePushNotifications(options?: PushNotificationOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setIsSubscribed(true);
        setSubscription(existingSubscription);
        options?.onSubscriptionChange?.(existingSubscription);
      }
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    return await Notification.requestPermission();
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in your browser");
      return null;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permission = await requestPermission();

      if (permission !== "granted") {
        toast.warning("Push notification permission denied");
        setIsLoading(false);
        return null;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }

      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      // TODO: Replace with your actual VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BGS3kM_bnPyQY9KIZBOd8C4XTnkV2k0zcPpyXcN7UqYHyFtGbH-GdvOxJ8xj9L4C0p3u6g_h8A9bBcDeFgH1iJk";

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      options?.onSubscriptionChange?.(newSubscription);

      // TODO: Send subscription to your backend
      // await fetch("/api/push/subscribe", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(newSubscription),
      // });

      toast.success("Push notifications enabled successfully");
      return newSubscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable push notifications");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) {
      return false;
    }

    setIsLoading(true);

    try {
      await subscription.unsubscribe();

      setSubscription(null);
      setIsSubscribed(false);
      options?.onSubscriptionChange?.(null);

      // TODO: Remove subscription from your backend
      // await fetch("/api/push/unsubscribe", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ endpoint: subscription.endpoint }),
      // });

      toast.success("Push notifications disabled");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to disable push notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (!isSupported || Notification.permission !== "granted") {
      toast.warning("Push notifications are not enabled");
      return;
    }

    new Notification("Test Notification", {
      body: "This is a test notification from Multimedia Portal",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "test-notification",
      requireInteraction: false,
    });
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    permission: typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray as BufferSource;
}
