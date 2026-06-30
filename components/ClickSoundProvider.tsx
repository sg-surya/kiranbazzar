"use client";

import React, { useEffect } from "react";
import { playClickSound } from "@/lib/sounds";

export default function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;

      const button = target.closest("button, a[role='button'], .btn-premium, [data-click-sound='true']");
      const input = target.closest("input[type='submit'], input[type='button']");
      const select = target.closest("select");
      const tab = target.closest('[role="tab"]');

      if (button || input || select || tab) {
        const disabled = (button as HTMLButtonElement)?.disabled || (input as HTMLInputElement)?.disabled;
        if (!disabled) {
          playClickSound();
        }
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return <>{children}</>;
}