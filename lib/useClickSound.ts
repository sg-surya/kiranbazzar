"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/sounds";

export function useClickSound() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const button = target.closest("button, [role='button'], a.btn-premium, input[type='button'], input[type='submit']");
      if (button && !(button as HTMLButtonElement).disabled) {
        playClickSound();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
}

export function useClickSoundForElement(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function handleClick() {
      playClickSound();
    }

    element.addEventListener("click", handleClick);
    return () => element.removeEventListener("click", handleClick);
  }, [ref]);
}