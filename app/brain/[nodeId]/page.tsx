import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "@/three/HomeClient";
import { getAllNodes, getNode } from "@/content";

/**
 * 3D deep-link route (Blueprint §1/§8; Issue 10). `/brain/<id>` opens the
 * experience and the DeepLink controller locates → flies to → focuses → opens
 * the node's terminal. Statically generated per node with SEO metadata; the
 * crawlable canonical content lives at `/explore/<id>`.
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
  if (!node) return { title: "The Brain" };
  return {
    title: `${node.title} · in the Brain`,
    description: node.fallback.seoDescription ?? node.fallback.summary,
  };
}

export default async function BrainNodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getNode(nodeId);

  return (
    <>
      <HomeClient />
      <div className="seo-only">
        <h1>{node ? node.title : "Inside The Mind"}</h1>
        <p>
          {node?.fallback.summary}{" "}
          <Link href={`/explore/${nodeId}`}>View as a page</Link>.
        </p>
      </div>
    </>
  );
}
