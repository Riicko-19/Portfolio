/**
 * The Chanakya Core anchor (Blueprint §11 — the nucleus, NOT its interior).
 * A single orientation node: the brightest object, the camera-recall target,
 * and the /brain/chanakya deep-link destination. Intentionally minimal.
 */
export const coreRaw = [
  {
    id: "chanakya",
    type: "core",
    kind: "about",
    title: "Chanakya Core",
    subtitle: "The nucleus of the mind",
    region: "core",
    importance: 1,
    tags: ["identity", "intelligence", "core"],
    connections: ["python", "threejs", "pytorch"],
    status: "live",
    content:
      "At the center of the mind sits the Chanakya Core — the seat of identity, the point every neural pathway returns to. From here, intuition becomes insight and data becomes will.",
    fallback: {
      summary:
        "The nucleus of the consciousness — identity, intelligence, and the center every pathway returns to.",
    },
  },
];
