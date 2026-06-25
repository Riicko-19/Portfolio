/**
 * Chanakya Core region (Phase 2 §9 "Core V1 — External").
 * The legendary nucleus + its subsystems. NOT the Core interior.
 */
export const coreRaw = [
  {
    id: "chanakya",
    type: "core",
    kind: "about",
    title: "Chanakya Core",
    subtitle: "The nucleus of the mind",
    region: "core",
    tier: "legendary",
    tags: ["identity", "intelligence", "kernel"],
    connections: ["scheduler", "memory-layer", "event-bus", "agent-runtime", "sentinel", "tool-layer", "knowledge-layer", "neural-router", "chanakya-os", "mem-starting-chanakya"],
    status: "live",
    content:
      "At the center of the mind sits the Chanakya Core — the seat of identity, the point every neural pathway returns to. From here, intuition becomes insight and data becomes will.",
    fallback: { summary: "The legendary nucleus of the consciousness — identity, intelligence, the centre of everything." },
  },
  { id: "scheduler", kind: "project", title: "Scheduler", subtitle: "Orchestrates thought", region: "core", tier: "major", tags: ["core", "orchestration"], connections: ["chanakya", "nodejs", "agent-runtime"], status: "live", content: "Prioritises and sequences the mind's processes." },
  { id: "memory-layer", kind: "project", title: "Memory Layer", subtitle: "Recall & context", region: "core", tier: "major", tags: ["core", "memory"], connections: ["chanakya", "postgresql", "rag", "long-term-memory"], status: "live", content: "Unified long-term recall and working context." },
  { id: "event-bus", kind: "project", title: "Event Bus", subtitle: "The nervous system", region: "core", tier: "major", tags: ["core", "messaging"], connections: ["chanakya", "scheduler", "distributed-systems"], status: "live", content: "Asynchronous message fabric connecting every subsystem." },
  { id: "agent-runtime", kind: "project", title: "Agent Runtime", subtitle: "Where agents live", region: "core", tier: "major", tags: ["core", "agents"], connections: ["chanakya", "agentic-ai", "scheduler", "research-multi-agent"], status: "wip", content: "Hosts and supervises autonomous agents safely and legibly." },
  { id: "sentinel", kind: "project", title: "Sentinel", subtitle: "Safety & guardrails", region: "core", tier: "major", tags: ["core", "safety", "monitoring"], connections: ["chanakya", "pytorch", "agent-runtime"], status: "wip", content: "The guardian — monitors, validates and protects the core from corruption." },
  { id: "tool-layer", kind: "project", title: "Tool Layer", subtitle: "Hands of the mind", region: "core", tier: "standard", tags: ["core", "tools"], connections: ["chanakya", "agent-runtime", "api-design"], status: "wip", content: "The interface through which agents act on the world." },
  { id: "knowledge-layer", kind: "project", title: "Knowledge Layer", subtitle: "What the mind knows", region: "core", tier: "major", tags: ["core", "knowledge"], connections: ["chanakya", "knowledge-graphs", "rag", "memory-layer"], status: "wip", content: "Structured knowledge — graphs, embeddings and retrieval." },
  { id: "neural-router", kind: "project", title: "Neural Router", subtitle: "Directs the signal", region: "core", tier: "standard", tags: ["core", "routing"], connections: ["chanakya", "event-bus", "scheduler"], status: "wip", content: "Routes thought between subsystems by intent." },
];
