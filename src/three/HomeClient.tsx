"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { detectWebGL, isLikelyPhone } from "@/lib/webgl";
import ExperienceErrorBoundary from "@/three/ExperienceErrorBoundary";

/**
 * Capability gate + client island loader (Blueprint §14/§15). Detects WebGL
 * and routes weak/phone devices to the structured 2D fallback instead of a
 * janky 3D experience. The heavy Experience is client-only (ssr:false).
 */
const Experience = dynamic(() => import("@/three/Experience"), {
  ssr: false,
  loading: () => <div className="pre-boot" />,
});

type Mode = "checking" | "ok" | "fallback";

export default function HomeClient() {
  const [mode, setMode] = useState<Mode>("checking");

  useEffect(() => {
    const cap = detectWebGL();
    setMode(!cap.supported || isLikelyPhone() ? "fallback" : "ok");
  }, []);

  if (mode === "checking") return <div className="pre-boot" />;

  if (mode === "fallback") {
    return (
      <div className="fallback-cta">
        <h1>Inside The Mind</h1>
        <p>
          This device is best served by the structured view — the same content,
          without the 3D world.
        </p>
        <Link className="cta" href="/explore">
          Enter the index →
        </Link>
      </div>
    );
  }

  return (
    <ExperienceErrorBoundary>
      <Experience />
    </ExperienceErrorBoundary>
  );
}
