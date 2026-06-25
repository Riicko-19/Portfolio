"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * macOS-style window frame (Blueprint §9) — traffic lights, draggable title
 * bar, minimize/close. Shared chrome for the windowing system.
 */
interface Props {
  title: string;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  width?: number;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
}

export default function TerminalChrome(p: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const winRef = useRef<HTMLDivElement>(null);

  // Asynchronous UI materialization (Phase 2.5): the window doesn't pop — after
  // the node fires (immediately on select), we wait 0.4s while the region
  // "processes", then the terminal blooms into existence out of the glow.
  // useLayoutEffect + gsap.set the "from" state pre-paint so there is no flash,
  // and we DON'T keep opacity in React's style prop (a drag re-render would
  // otherwise clobber gsap's inline opacity and hide the window).
  useLayoutEffect(() => {
    const el = winRef.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, scale: 0.9, filter: "blur(8px)" },
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.6,
        delay: 0.4,
        ease: "power3.out",
      },
    );
    return () => {
      tween.kill();
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Don't start a drag (or capture the pointer) when the press lands on a
    // traffic-light button — capture would swallow its click.
    if ((e.target as HTMLElement).closest(".tl")) return;
    p.onFocus();
    drag.current = { dx: e.clientX - p.x, dy: e.clientY - p.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = Math.max(0, e.clientX - drag.current.dx);
    const ny = Math.max(0, e.clientY - drag.current.dy);
    p.onMove(nx, ny);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      ref={winRef}
      className="term-window"
      style={{
        left: p.x,
        top: p.y,
        zIndex: p.z,
        width: p.width ?? 364,
        transformOrigin: "50% 0%",
      }}
      onMouseDown={p.onFocus}
    >
      <div
        className="term-titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="term-lights">
          <button
            type="button"
            className="tl tl-red"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              p.onClose();
            }}
            aria-label="Close window"
          />
          <button
            type="button"
            className="tl tl-yellow"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              p.onMinimize();
            }}
            aria-label={p.minimized ? "Restore window" : "Minimize window"}
          />
          <span className="tl tl-green" aria-hidden />
        </div>
        <div className="term-title">{p.title}</div>
      </div>
      {!p.minimized && <div className="term-body">{p.children}</div>}
    </div>
  );
}
