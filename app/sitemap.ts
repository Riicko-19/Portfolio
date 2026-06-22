import type { MetadataRoute } from "next";
import { getAllNodes } from "@/content";

const BASE = "https://inside-the-mind.local";

/** Sitemap generated from the content graph (Blueprint §14/§16). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/explore`, priority: 0.8 },
    ...getAllNodes().map((n) => ({
      url: `${BASE}/explore/${n.id}`,
      priority: 0.6,
    })),
  ];
}
