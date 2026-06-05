"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useSound, type SoundId } from "@/lib/audio/use-sound";
import "./pressable.css";

type PressableProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  sound?: SoundId | false;
  children: ReactNode;
};

/** Bouton avec scale + son UI optionnel. */
export function Pressable({ sound = "ui_click", onClick, className, children, ...rest }: PressableProps) {
  const { play } = useSound();

  return (
    <button
      type="button"
      {...rest}
      className={className ? `pressable ${className}` : "pressable"}
      onClick={(e) => {
        if (sound) void play(sound);
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
