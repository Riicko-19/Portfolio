/**
 * Cerebellum content (Blueprint §4) — Skills, Tech Stack & Tools.
 * The one fully-built region for the Phase 1 vertical slice.
 *
 * Authored as raw objects; validated against NodeSchema in `index.ts`.
 * Defaults (type, parentId, importance, etc.) are filled by the schema.
 */
export const cerebellumRaw = [
  {
    id: "typescript",
    kind: "tech",
    title: "TypeScript",
    subtitle: "Typed JavaScript at scale",
    region: "cerebellum",
    importance: 0.95,
    tags: ["language", "frontend", "backend", "types"],
    connections: ["react", "nextjs", "node", "threejs"],
    status: "live",
    links: [{ label: "Docs", url: "https://www.typescriptlang.org" }],
    content:
      "My default language for application code. Strict mode everywhere — the type system is a design tool, not paperwork. Drives the schemas, the state layer and the content pipeline of this very experience.",
    fallback: {
      summary:
        "Primary application language. Strict TypeScript across frontend, backend and tooling.",
    },
  },
  {
    id: "react",
    kind: "tech",
    title: "React",
    subtitle: "Declarative UI",
    region: "cerebellum",
    importance: 0.95,
    tags: ["frontend", "ui", "javascript"],
    connections: ["typescript", "nextjs", "threejs"],
    status: "live",
    links: [{ label: "Docs", url: "https://react.dev" }],
    content:
      "The backbone of every interface I build, including the declarative scene graph driving this brain via react-three-fiber. Hooks, suspense, and a disciplined state boundary.",
    fallback: {
      summary: "Core UI library. Powers both conventional interfaces and the R3F scene graph.",
    },
  },
  {
    id: "threejs",
    kind: "tech",
    title: "Three.js / R3F",
    subtitle: "Real-time WebGL",
    region: "cerebellum",
    importance: 0.9,
    tags: ["3d", "webgl", "graphics", "shaders"],
    connections: ["react", "glsl", "typescript"],
    status: "live",
    links: [
      { label: "three.js", url: "https://threejs.org" },
      { label: "R3F", url: "https://docs.pmnd.rs/react-three-fiber" },
    ],
    content:
      "Real-time 3D on the web. Instancing, custom shaders, camera choreography and performance budgets. This entire consciousness simulation is built on it.",
    fallback: {
      summary: "Real-time WebGL via three.js and react-three-fiber. Instancing, shaders, camera systems.",
    },
  },
  {
    id: "glsl",
    kind: "skill",
    title: "GLSL / Shaders",
    subtitle: "Programming the GPU",
    region: "cerebellum",
    importance: 0.78,
    tags: ["graphics", "gpu", "shaders", "math"],
    connections: ["threejs"],
    status: "live",
    content:
      "Vertex and fragment shaders for particle systems, flow effects and procedural materials. The brain formation you just watched is a single GPU draw driven by a custom shader.",
    fallback: {
      summary: "GPU programming with GLSL — particle systems, procedural materials, flow effects.",
    },
  },
  {
    id: "nextjs",
    kind: "tech",
    title: "Next.js",
    subtitle: "The React framework",
    region: "cerebellum",
    importance: 0.85,
    tags: ["frontend", "ssr", "framework"],
    connections: ["react", "typescript", "node"],
    status: "live",
    links: [{ label: "Docs", url: "https://nextjs.org" }],
    content:
      "App Router, server components and SSR. Here it serves the crawlable 2D fallback while the 3D world runs as a client island — one content source, two presentations.",
    fallback: {
      summary: "React framework. SSR + App Router; serves this site's crawlable fallback layer.",
    },
  },
  {
    id: "node",
    kind: "tech",
    title: "Node.js",
    subtitle: "Server-side JavaScript",
    region: "cerebellum",
    importance: 0.8,
    tags: ["backend", "runtime", "javascript"],
    connections: ["typescript", "nextjs", "postgres"],
    status: "live",
    content:
      "APIs, build tooling and content pipelines. The runtime behind the services I ship.",
    fallback: { summary: "Server-side runtime for APIs, tooling and content pipelines." },
  },
  {
    id: "python",
    kind: "tech",
    title: "Python",
    subtitle: "ML & scripting",
    region: "cerebellum",
    importance: 0.85,
    tags: ["language", "ml", "data", "backend"],
    connections: ["pytorch", "langchain"],
    status: "live",
    content:
      "The language I reach for in the ML and data world — training loops, data wrangling, research scripts.",
    fallback: { summary: "Primary language for ML, data work and research scripting." },
  },
  {
    id: "pytorch",
    kind: "tech",
    title: "PyTorch",
    subtitle: "Deep learning",
    region: "cerebellum",
    importance: 0.82,
    tags: ["ml", "deep-learning", "ai", "gpu"],
    connections: ["python", "langchain"],
    status: "live",
    links: [{ label: "Docs", url: "https://pytorch.org" }],
    content:
      "Building and training neural networks — from custom architectures to fine-tuning. Where the 'AI engineer' part of the mind lives.",
    fallback: { summary: "Deep learning framework. Model building, training and fine-tuning." },
  },
  {
    id: "langchain",
    kind: "tech",
    title: "LLM Tooling",
    subtitle: "Agents & RAG",
    region: "cerebellum",
    importance: 0.8,
    tags: ["ai", "llm", "agents", "rag"],
    connections: ["python", "pytorch"],
    status: "wip",
    content:
      "Retrieval-augmented generation, tool-using agents and evaluation harnesses around large language models — the systems work of applied AI.",
    fallback: { summary: "Applied LLM systems — RAG, agents, evaluation harnesses." },
  },
  {
    id: "postgres",
    kind: "tech",
    title: "PostgreSQL",
    subtitle: "Relational data",
    region: "cerebellum",
    importance: 0.7,
    tags: ["database", "backend", "sql"],
    connections: ["node"],
    status: "live",
    content:
      "My default datastore. Schema design, indexing and queries that earn their keep.",
    fallback: { summary: "Primary relational database — schema design, indexing, query tuning." },
  },
  {
    id: "docker",
    kind: "tech",
    title: "Docker",
    subtitle: "Containers",
    region: "cerebellum",
    importance: 0.68,
    tags: ["devops", "infra", "tooling"],
    connections: ["node", "postgres"],
    status: "live",
    content:
      "Reproducible environments from laptop to production. The packaging layer for everything I deploy.",
    fallback: { summary: "Containerization for reproducible environments and deployment." },
  },
  {
    id: "git",
    kind: "skill",
    title: "Git",
    subtitle: "Version control",
    region: "cerebellum",
    importance: 0.65,
    tags: ["tooling", "workflow", "collaboration"],
    connections: ["docker"],
    status: "live",
    content:
      "The connective tissue of any engineering team — branching strategy, clean history, code review as a craft.",
    fallback: { summary: "Version control and collaboration workflow." },
  },
];
