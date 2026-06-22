import Link from "next/link";
import HomeClient from "@/three/HomeClient";
import { getPopulatedRegions, getRegionNodes } from "@/content";

/**
 * Home route. Renders the 3D client island, plus an SSR'd, crawlable content
 * summary (Blueprint §1 hybrid + §14 SEO). The summary is visually hidden but
 * present in the DOM for crawlers and no-JS clients.
 */
export default function Home() {
  const regions = getPopulatedRegions();

  return (
    <>
      <HomeClient />

      <div className="seo-only">
        <h1>Inside The Mind — A Digital Consciousness</h1>
        <p>
          An explorable 3D simulation of an AI engineer&apos;s mind. Projects,
          skills, technologies, memories and goals exist as navigable locations
          inside a living brain. Prefer a structured view?{" "}
          <Link href="/explore">Browse the full index</Link>.
        </p>
        {regions.map((r) => (
          <section key={r.id}>
            <h2>{r.name}</h2>
            <p>{r.blurb}</p>
            <ul>
              {getRegionNodes(r.id).map((n) => (
                <li key={n.id}>
                  <Link href={`/explore/${n.id}`}>{n.title}</Link> —{" "}
                  {n.fallback.summary}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
