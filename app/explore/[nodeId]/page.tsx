import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllNodes,
  getNode,
  getNeighbourIds,
  getRegion,
} from "@/content";

/**
 * 2D node detail (Blueprint §1 deep link + crawlable). Statically generated per
 * node, SSR'd with per-node SEO metadata, and links back into the 3D world.
 */
export function generateStaticParams() {
  return getAllNodes().map((n) => ({ nodeId: n.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}): Promise<Metadata> {
  const { nodeId } = await params;
  const node = getNode(nodeId);
  if (!node) return { title: "Not found" };
  return {
    title: node.fallback.seoTitle ?? node.title,
    description: node.fallback.seoDescription ?? node.fallback.summary,
  };
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getNode(nodeId);
  if (!node) notFound();

  const region = getRegion(node.region);
  const neighbours = getNeighbourIds(nodeId);

  return (
    <main className="node-page">
      <nav className="node-nav">
        <Link href="/explore">← All nodes</Link>
        <Link href={`/?node=${node.id}`}>Open in 3D ↗</Link>
      </nav>

      <span className="muted small">
        {region?.name} · {node.kind}
        {node.status ? ` · ${node.status}` : ""}
      </span>
      <h1>{node.title}</h1>
      {node.subtitle && <p className="lead">{node.subtitle}</p>}
      <p>{node.content || node.fallback.summary}</p>

      {node.tags.length > 0 && (
        <div className="tags">
          {node.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {node.links.length > 0 && (
        <ul className="node-links">
          {node.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {neighbours.length > 0 && (
        <section className="node-connected">
          <h2>Connected</h2>
          <ul>
            {neighbours.map((id) => {
              const n = getNode(id);
              return n ? (
                <li key={id}>
                  <Link href={`/explore/${id}`}>{n.title}</Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
