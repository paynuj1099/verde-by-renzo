"use client";

import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebase";

export const DEVICE_ID_KEY = "verde-device-id";

function getDeviceDetails() {
  const agent = navigator.userAgent;
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Firefox\//.test(agent)
      ? "Firefox"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Browser";
  const os = /Android/.test(agent)
    ? "Android"
    : /iPhone|iPad|iPod/.test(agent)
      ? "iOS"
      : /Windows/.test(agent)
        ? "Windows"
        : /Mac OS/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "Unknown OS";
  const type = /Android|iPhone|iPad|iPod|Mobile/.test(agent)
    ? "mobile"
    : "desktop";
  return { browser, os, type };
}

export default function DevicePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    const deviceRef = doc(firestore, "users", user.uid, "devices", deviceId);
    const details = getDeviceDetails();
    const heartbeat = () =>
      setDoc(
        deviceRef,
        {
          ...details,
          label: `${details.browser} on ${details.os}`,
          online: true,
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      ).catch((error) =>
        console.error("Unable to update device presence:", error),
      );

    void heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      void setDoc(
        deviceRef,
        { online: false, lastSeen: serverTimestamp() },
        { merge: true },
      );
    };
  }, [user]);

  return null;
}
