"use client";

import { useMind } from "@/state/store";
import { getNode } from "@/content";
import TerminalChrome from "./TerminalChrome";
import InformationTerminal from "./InformationTerminal";

/**
 * Window manager (Blueprint §9) — renders the open terminal windows as a DOM
 * overlay above the canvas. z-order, focus, move, minimize and the 3-window
 * cap are owned by the store.
 */
export default function WindowManager() {
  const windows = useMind((s) => s.windows);
  const closeWindow = useMind((s) => s.closeWindow);
  const minimizeWindow = useMind((s) => s.minimizeWindow);
  const focusWindow = useMind((s) => s.focusWindow);
  const moveWindow = useMind((s) => s.moveWindow);

  return (
    <div className="window-layer">
      {windows.map((w) => {
        const node = getNode(w.nodeId);
        if (!node) return null;
        return (
          <TerminalChrome
            key={w.id}
            title={`${node.title} — info`}
            x={w.x}
            y={w.y}
            z={w.z}
            width={424}
            minimized={w.minimized}
            onClose={() => closeWindow(w.id)}
            onMinimize={() => minimizeWindow(w.id)}
            onFocus={() => focusWindow(w.id)}
            onMove={(x, y) => moveWindow(w.id, x, y)}
          >
            <InformationTerminal nodeId={w.nodeId} />
          </TerminalChrome>
        );
      })}
    </div>
  );
}
