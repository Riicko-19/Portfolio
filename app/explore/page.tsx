import type { Metadata } from "next";
import Link from "next/link";
import { getPopulatedRegions, getRegionNodes } from "@/content";

export const metadata: Metadata = {
  title: "Explore the Mind",
  description:
    "A structured index of every region, skill, project and memory — the same content the 3D world is built from.",
};

/**
 * 2D fallback index (Blueprint §1 — first-class, crawlable, SSR). Renders from
 * the same content API as the 3D world; no WebGL required.
 */
export default function ExplorePage() {
  const regions = getPopulatedRegions();

  return (
    <main className="explore">
      <header className="explore-head">
        <Link href="/" className="back">
          ← Enter the 3D mind
        </Link>
        <h1>Explore the Mind</h1>
        <p className="muted">
          A structured index of every region and node. The same content source
          that powers the 3D world.
        </p>
      </header>

      {regions.map((r) => (
        <section
          key={r.id}
          className="explore-region"
          style={{ borderColor: r.color }}
        >
          <h2 style={{ color: r.color }}>{r.name}</h2>
          <p className="muted">{r.blurb}</p>
          <ul className="explore-list">
            {getRegionNodes(r.id).map((n) => (
              <li key={n.id}>
                <Link href={`/explore/${n.id}`}>
                  <strong>{n.title}</strong>
                </Link>
                {n.subtitle && <span className="muted"> — {n.subtitle}</span>}
                <div className="muted small">{n.fallback.summary}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
