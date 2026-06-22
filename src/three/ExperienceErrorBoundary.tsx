"use client";

import React from "react";
import Link from "next/link";

/**
 * Catches any render/runtime error in the 3D Experience tree (including R3F
 * scene errors, which bubble to the nearest boundary above the Canvas) and
 * shows a legible message + the 2D fallback, instead of a blank crash overlay.
 */
interface State {
  error: Error | null;
}

export default class ExperienceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Inside The Mind] Experience crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fallback-cta">
          <h1>The 3D world hit an error</h1>
          <p
            className="muted small"
            style={{
              maxWidth: "60ch",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-mono)",
            }}
          >
            {this.state.error.message || String(this.state.error)}
          </p>
          <Link className="cta" href="/explore">
            Open the structured view →
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
