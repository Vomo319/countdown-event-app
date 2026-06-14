"use client";

import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[v0] beforeinstallprompt event fired");
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show the prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("[v0] App was installed");
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[v0] User response: ${outcome}`);
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error("[v0] Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease]">
      <div className="max-w-md mx-auto px-4 pb-4">
        <div className="bg-[var(--accent)] rounded-[20px] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-white tracking-tight mb-1">
                Get the app
              </h3>
              <p className="text-[13px] text-white/90 leading-relaxed">
                Install Waiting For on your phone for quick access to your countdowns anytime.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white text-[20px] leading-none mt-1 ml-2 flex-shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 rounded-[10px] bg-white/20 text-white text-[13px] font-medium active:bg-white/30 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 px-3 py-2 rounded-[10px] bg-white text-[var(--accent)] text-[13px] font-semibold active:opacity-90 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
