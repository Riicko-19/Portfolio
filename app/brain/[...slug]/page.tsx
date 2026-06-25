import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "@/three/HomeClient";
import { getAllNodes, getNode } from "@/content";

/**
 * 3D deep-link route (Phase 2 §12). Catch-all so both `/brain/python` and
 * nested `/brain/research/agentic-ai` work — the LAST segment is the node id.
 * Opens the experience; DeepLink locates → flies → focuses → opens the terminal.
 */
export function generateStaticParams() {
  return getAllNodes().map((n) => ({ slug: [n.id] }));
}

function nodeIdFrom(slug: string[]): string {
  return decodeURIComponent(slug[slug.length - 1] ?? "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode(nodeIdFrom(slug));
  if (!node) return { title: "The Brain" };
  return {
    title: `${node.title} · in the Brain`,
    description: node.fallback.seoDescription ?? node.fallback.summary,
  };
}

export default async function BrainNodePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const id = nodeIdFrom(slug);
  const node = getNode(id);

  return (
    <>
      <HomeClient />
      <div className="seo-only">
        <h1>{node ? node.title : "Inside The Mind"}</h1>
        <p>
          {node?.fallback.summary}{" "}
          <Link href={`/explore/${id}`}>View as a page</Link>.
        </p>
      </div>
    </>
  );
}
