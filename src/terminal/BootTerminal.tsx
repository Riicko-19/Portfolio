"use client";

import { useCallback, useEffect, useState } from "react";
import { useMind } from "@/state/store";

/**
 * Boot System (Blueprint §9 Boot Terminal). Matches the reference boot
 * sequence, reveals checklist lines, then waits for ENTER → flips phase to
 * "forming" (which triggers the particle assembly) and dissolves itself.
 */
const LINES = [
  "Initializing Cognitive Kernel",
  "Loading Memory Graph",
  "Loading Neural Topology",
  "Loading Synaptic Structures",
  "Scanning Consciousness",
  "Verifying Identity",
];

export default function BootTerminal() {
  const phase = useMind((s) => s.phase);
  const setPhase = useMind((s) => s.setPhase);
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= LINES.length;

  useEffect(() => {
    if (phase !== "boot" || revealed >= LINES.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 320 + revealed * 70);
    return () => clearTimeout(t);
  }, [revealed, phase]);

  const proceed = useCallback(() => {
    if (useMind.getState().phase !== "boot") return;
    setRevealed(LINES.length);
    setPhase("forming");
  }, [setPhase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") proceed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proceed]);

  if (phase === "ready") return null;

  return (
    <div className={`boot-overlay ${phase === "forming" ? "boot--fading" : ""}`}>
      <div className="boot-window">
        <div className="boot-titlebar">
          <div className="term-lights">
            <span className="tl tl-red" />
            <span className="tl tl-yellow" />
            <span className="tl tl-green" />
          </div>
          <div className="term-title">~ zsh</div>
        </div>
        <div className="boot-body">
          <div className="boot-prompt">
            <span className="boot-user">INSIDE_THE_MIND@chanakya</span> ~ %
            system_boot
          </div>
          <div className="boot-init">Boot Sequence Initiated...</div>
          {LINES.slice(0, revealed).map((l) => (
            <div key={l} className="boot-line">
              <span>&gt; {l}</span>
              <span className="boot-ok">[ OK ]</span>
            </div>
          ))}
          {done && <div className="boot-await">Awaiting Neural Handshake...</div>}
          {done && (
            <button className="boot-enter" onClick={proceed}>
              PRESS ENTER TO CONTINUE
              <span className="boot-cursor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
