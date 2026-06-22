# Inside The Mind — Engineering Blueprint & Architecture Plan

## Context

**Inside The Mind** is a greenfield project: an explorable 3D "digital consciousness" — the navigable mind of an AI engineer — where projects, skills, technologies, memories, research, and goals exist as physical locations inside a living brain. The target feel is *Google Earth + No Man's Sky + Sketchfab + a consciousness simulation*, not a website.

This document is an **architecture blueprint only**. No implementation code is included by design. It is written to be detailed enough that a small team of strong engineers could begin Phase 0 immediately.

**Locked product decisions (from the client):**
| Dimension | Decision | Architectural consequence |
|---|---|---|
| Purpose | **Equal-weight hybrid** — must impress *and* convert | Single source-of-truth content layer feeding **two** first-class presentation layers (3D world + structured 2D fallback). SEO + deep-linking are mandatory, not optional. |
| Devices | **Desktop + tablet** (phones → fallback) | 3D world may assume a *decent* GPU but must degrade gracefully on tablet. Touch is a first-class input. Phones are routed to the 2D experience. |
| Content scale | **Medium, ~60–200 nodes** | Real LOD + instancing + a typed content schema + client search are required from the start. Not hand-wavable. |
| Ambition | **MVP now, masterpiece later** | Phase so a genuinely good MVP ships early, but architect the seams so bespoke shaders/systems layer in **without rewrites**. |

The single most important tension to resolve up front: the brief says *"not a portfolio website,"* yet the client requires it to **convert** (recruiters/clients finding work and contact fast). These are reconciled by making **exploration and a fast-path coexist** — the world is the experience, but a command palette / spotlight + deep links + a 2D fallback guarantee anyone can reach any content in seconds. This principle threads through every section below.

---

# SECTION 1 — Executive Design Review

### What is strong
- **A genuinely memorable spatial metaphor.** "Skills live in the cerebellum, memories in the temporal lobe" is intuitive, narratively rich, and gives every piece of content a *place* — which is what makes spatial UIs sticky.
- **Built-in narrative.** The boot → formation → exploration arc is a story, not a menu. That is the differentiator vs. 10,000 other dev portfolios.
- **The Core as a destination.** Having a literal nucleus (Chanakya Core) gives the world a center of gravity, an orientation anchor, and an emotional climax. Strong.
- **The reference package is coherent.** The mood-board (neural blue + gold core + macOS terminal) is internally consistent and already 80% of an art direction.

### What is weak
- **Discoverability vs. spectacle.** Pure free exploration *buries* content. A recruiter who can't find your React project in 15 seconds bounces. The world must ship with a parallel fast-path (spotlight/command palette + deep links) on day one, or it fails its conversion goal.
- **Second-visit fatigue.** The boot/formation cinematic is magic once, tedious the third time. Needs skip + "returning user" fast-boot + persisted discovery state.
- **Content authoring burden is underestimated.** A spatial world needs *more* content discipline than a flat site (positions, connections, weights, media per node). Without a content pipeline this stalls.

### What is risky
- **Camera UX is the whole product.** If the camera disorients, induces motion sickness, or feels floaty, the experience dies regardless of visual quality. This is the #1 technical risk and deserves the most engineering rigor (Section 7).
- **Performance on tablets.** Additive particles + bloom + transparency are fill-rate killers. A naive build will run at 20fps on an iPad. Budgets must be enforced from the first commit, not retrofitted.
- **"Infinite zoom" as stated is a trap.** Literal infinite zoom hits floating-point precision failure and has no content to justify it. It must be reinterpreted as **semantic scale tiers** (Section 7).

### What is unrealistic
- **Every memory as a full bespoke environment.** 200 nodes × custom scenes = years of work. Memories must be *tiered* — most are enriched terminals; a handful of flagship memories are true environments (Section 10).
- **A live force-directed physics graph at runtime.** Tempting, but it's a performance and stability sink. Layout must be **precomputed**, not simulated live (Section 6).

### What should change
1. **Reframe "infinite zoom" → semantic LOD tiers** (Galaxy/Brain → Region → Cluster → Node → Interior).
2. **Add a fast-path from day one** (⌘K spotlight + command terminal + deep links) so the world never traps the user.
3. **Make the 2D fallback a first-class citizen** sharing one content source, not a sad `<noscript>`.
4. **Tier the memory system** to control scope.
5. **Precompute the neural graph layout**; never run live physics.
6. **Define hard performance budgets** (draw calls, triangles, particles, post-pass resolution) before feature work.

### What should remain
The boot sequence, the particle formation, the lobe-as-region metaphor, the Chanakya Core centerpiece, the macOS terminal aesthetic, and the neural-pathway travel. These are the soul of the project — keep them, but engineer them with discipline.

### Net improvement thesis
Keep the magic; add a **fast lane**. The world is for the people who want to be moved; the spotlight/fallback is for the recruiter with 30 seconds. Architect both from one content graph. This single decision is what turns a beautiful tech demo into a beautiful product that also gets the engineer hired.

---

# SECTION 2 — System Overview

### High-level architecture

```
                                  ┌────────────────────────────────────┐
                                  │            CONTENT SYSTEM           │
                                  │  Typed content (MDX + schema, Zod)  │
                                  │  → Build-time graph + search index  │
                                  │  → Single source of truth           │
                                  └───────────────┬────────────────────┘
                                                  │ feeds (both)
                        ┌─────────────────────────┴──────────────────────────┐
                        │                                                      │
                        ▼                                                      ▼
        ┌──────────────────────────────────────────┐          ┌──────────────────────────────┐
        │        3D EXPERIENCE (client island)      │          │   2D FALLBACK (SSR routes)    │
USER ──▶│                                            │          │  Crawlable, accessible,       │
  │     │  ┌──────────────┐                          │          │  fast. Phones + no-WebGL +    │
  │     │  │ BOOT SYSTEM  │ terminal boot → ENTER    │          │  SEO + deep-link landing.     │
  │     │  └──────┬───────┘                          │          └──────────────────────────────┘
  │     │         │ access granted → dissolve         │
  │     │         ▼                                    │
  │     │  ┌──────────────┐   particles form brain    │
  │     │  │ BRAIN SCENE  │◀──────────────────────────┤
  │     │  │ (the world)  │   regions, ambient field   │
  │     │  └──────┬───────┘                            │
  │     │         │ contains                            │
  │     │         ▼                                     │
  │     │  ┌──────────────┐   selectable, instanced     │
  │     │  │ NODE SYSTEM  │   projects/skills/etc.       │
  │     │  └──┬────────┬──┘                              │
  │     │     │        │ connected by                    │
  │     │     │        ▼                                 │
  │     │     │  ┌──────────────┐  splines + signal flow │
  │     │     │  │ NEURAL GRAPH │  (precomputed layout)   │
  │     │     │  └──────┬───────┘                         │
  │  inputs   │         │ travel along                    │
  │  (mouse/  │         ▼                                 │
  │  touch/   │  ┌──────────────────┐  orbit/focus/travel │
  └─keyboard)─┼─▶│ NAVIGATION SYSTEM│  /neural/free-fly   │
        │     │  │  + CAMERA DIRECTOR (FSM, sole camera authority)
        │     │  └──────┬───────────┘                     │
        │     │         │ drives + reads selection         │
        │     │         ▼                                  │
        │     │  ┌──────────────────┐  macOS windows       │
        │     │  │ TERMINAL SYSTEM  │  boot/info/search/   │
        │     │  │  (DOM overlay)   │  command/memory      │
        │     │  └──────────────────┘                      │
        │     └────────────────────────────────────────────┘
        │              ▲           ▲
        │              │           │ all read/write
        │     ┌────────┴───────────┴─────────┐
        └────▶│   GLOBAL STATE (Zustand)     │  camera | world | selection
              │   transient + reactive slices│  terminals | navigation | content
              └──────────────────────────────┘
```

### Relationships (the contracts between systems)

- **Content System → everything.** One typed graph (nodes + edges + search index) is built at compile time and consumed by *both* the 3D world and the 2D fallback. No system invents content; they render it.
- **Boot System → Brain Scene.** Boot owns the intro state machine; on `ACCESS_GRANTED` it hands off to the particle formation, which resolves into the live Brain Scene. One-way handoff; boot tears itself down.
- **Brain Scene ⊃ Node System ⊃ Neural Graph.** The scene is the spatial container; nodes are its inhabitants; the graph is the relationships between them. The scene owns LOD/culling tiers and tells nodes when to materialize.
- **Navigation/Camera Director ↔ State.** The **Camera Director is the *only* writer of camera transform.** Every other system *requests* camera intent (focus this node, travel to this region) via state/events; the Director arbitrates and executes. This is non-negotiable — split camera ownership is how these projects rot.
- **Selection ↔ Terminal System.** Selecting a node sets `selection` state; the Terminal System reacts by opening an Information terminal bound to that node's content. Terminals never query content directly outside the content API.
- **State is the spine.** Zustand slices are the integration surface. Systems communicate through state and a small event bus, *not* direct imports, to keep them swappable (critical for "masterpiece later" without rewrites).

---

# SECTION 3 — World Design

### Size (in world units, WU)
- **Whole brain ≈ 240 WU** along its longest (anterior–posterior) axis; ~180 WU tall, ~200 WU wide. Bounded, deliberately. A bounded world is navigable; an unbounded one is where users get lost and floats lose precision.
- **Node spacing:** clusters occupy ~20–40 WU pockets; individual nodes 2–6 WU apart within a cluster. This keeps any region framable in a single focus shot.
- **Why bounded matters:** at this scale all coordinates stay well within float32 safe range (no origin-rebasing needed), frustum culling is cheap, and the "infinite zoom" feeling is delivered by **semantic tiers + depth-of-field**, not by literally flying forever.

### Orientation (how users always know where they are)
Five always-available orientation aids:
1. **The Core as North Star.** The Chanakya Core is the brightest object and visible (as a glow through the haze) from anywhere. It is the world's sun — instinctive directional anchor.
2. **Neural Compass HUD.** A small persistent compass/orientation ring showing current region, heading, and a chevron toward the Core.
3. **Region color identity.** Each region owns a hue (Section 4). Peripheral vision tells you which lobe you're in before you read anything.
4. **"You are here" breadcrumb.** Tier + region + cluster + node shown as a path (e.g. `Brain ▸ Cerebellum ▸ Frontend ▸ React`), also the shareable deep-link.
5. **Minimap / connectome map.** A toggleable schematic top-down map of the brain with regions and the user's marker — the "Google Earth zoomed-out" view.

### Geography model
- **Anatomical-but-stylized.** Real-ish brain silhouette (from the formation reference) but regions are *cleanly separated volumes* with breathing room, not a tangled organic mass. Legibility beats anatomical accuracy.
- **Hemispheres = macro duality.** Left hemisphere = analytical/engineering clusters; Right hemisphere = creative/experiential clusters. Lobes are regions *within* the silhouette spanning hemispheres as their theme dictates (Section 4).
- **Pathways = neural tracts.** Regions connect via glowing white-matter "tracts" (thick bundles); individual nodes connect via thin synapses. The tracts are the highways; synapses are the streets.

### Avoiding getting lost (the anti-disorientation system)
- **Bounded world + soft boundary** (the haze thickens and gently pushes the camera back near the edge; no hard wall, no fall-off-the-map).
- **Snap-back / recall:** press `H` (or "core" command) → smooth Travel to the Core from anywhere. Always one keystroke home.
- **Camera never untethered** except in explicit Free-Fly mode (which has its own re-orient button).
- **Fast-travel:** the minimap and spotlight let you jump directly to any region/node — getting lost is impossible if teleport-home and teleport-to-anything always exist.
- **Persistent labels at distance:** region labels fade in as billboards when zoomed out, so the macro structure is always readable.

### Discovery
- **Progressive reveal ("fog of cognition").** Undiscovered regions read as dim potential — visible as structure but unlit/unlabeled. Approaching or first-visiting "ignites" them. This rewards exploration without hiding that there *is* more.
- **Ambient pull.** Undiscovered, high-importance nodes emit a subtle shimmer/pulse and a faint signal toward the Core, drawing the eye.
- **Discovery state persists** (localStorage) so returning users see their explored map and only new content shimmers.
- **Optional guided tour ("synaptic tour"):** a one-click cinematic that flies a curated path Core → highlights → contact, for users who want the story without the driving. This is also the conversion safety net.

### Complete world structure (tiers)
```
TIER 0  BRAIN / GALAXY   whole-brain overview, regions glow, minimap context
TIER 1  REGION           inside a lobe; clusters resolve; region-themed lighting
TIER 2  CLUSTER          a node group; individual nodes + their synapses visible
TIER 3  NODE             single node framed; Information terminal available
TIER 4  INTERIOR         inside a node/memory (a pocket scene or rich terminal)
```
Each tier defines what is loaded, what is interactive, what the camera does, and what HUD shows. Tier transitions are the "zoom" (Section 7).

---

# SECTION 4 — Brain Geography

Reconciling the reference legend with the hemisphere model. Hues are **restrained** — desaturated, deep, with emissive accents — to avoid the rainbow-cyberpunk cliché (Section 12).

| Region | Hemisphere bias | Purpose (content domain) | Signature color | Visual identity |
|---|---|---|---|---|
| **Frontal Lobe** | Both (forward) | **Vision & Goals** — roadmap, future research, where the engineer is headed | Cool violet `#7C6CFF` | Forward-leaning crystalline structures reaching outward; "unfinished"/under-construction motifs; horizon glow |
| **Parietal Lobe** | Both (upper-rear) | **Navigation & Systems thinking** — the connectome/map itself, "how I approach problems," system designs | Slate-cyan `#4FB6C9` | The literal map hub; lattice/grid neurons; the most "structured" geometry |
| **Occipital Lobe** | Right-leaning | **Visual & Creative** — design work, visualization projects, generative/creative coding, shaders | Magenta-rose `#E85C9A` | Most luminous/painterly; light refraction, lens motifs, "rendered" surfaces |
| **Temporal Lobe** | Both (lower-side) | **Memory & Journey** — milestones, education, career story, formative moments | Warm green-gold `#8FB84E` | Memory spaces live here; softer, nostalgic, particle-heavy; the "archive" |
| **Cerebellum** | Both (lower-rear) | **Skills, Tech Stack & Tools** — languages, frameworks, tooling, the technical arsenal | Amber `#E0A23C` | Dense, fine-grained, highly ordered (cerebellum = packed neurons); tool-like precision |
| **Brain Stem** | Central (base) | **Fundamentals** — CS core, DSA, OS, networking, core logic; the load-bearing base | Deep teal `#2C7A6B` | Rooted, columnar, structural; the "trunk" everything grows from; calm, grounded |
| **Left Hemisphere** | — | Analytical/engineering *grouping* (overlays Cerebellum, Brain Stem, parts of Parietal) | Cooler tint overlay | Sharper geometry, ordered lattices, blue-shifted |
| **Right Hemisphere** | — | Creative/experiential *grouping* (overlays Occipital, parts of Temporal/Frontal) | Warmer tint overlay | Organic, flowing, warmer-shifted |
| **Chanakya Core** | Center | **Identity & Connection** — manifesto, the "self," about, contact/CTA | Gold-white `#FFC76B` core, indigo void around | The sun/nucleus; energy core; see Section 11 |

For each region, the **user journey** is consistent: arrive via tract from Core or neighbor → region ignites and color-themes the lighting → clusters resolve at Tier 1 → select a cluster to drop to Tier 2 → pick a node → Information terminal at Tier 3 → optionally dive to Interior (Tier 4). **Interaction patterns:** hover = node breathes + label; click/tap = focus + terminal; connected nodes highlight; double-click/long-press = travel along synapse; ESC/back = ascend one tier.

**Hemisphere duality as narrative:** a subtle directional "current" flows left→right across the brain symbolizing engineering↔creativity integration, meeting at the Core. It's an ambient motion cue, not a gameplay mechanic — reinforces the "whole mind" theme.

---

# SECTION 5 — Node Architecture

### Node types
| Type | Tier it lives at | Role |
|---|---|---|
| `core` | center | The Chanakya Core (singleton) |
| `region` | Tier 0/1 | A lobe; a spatial container + theme |
| `cluster` | Tier 1/2 | A themed sub-group within a region (e.g. "Frontend", "Memories 2021") |
| `node` | Tier 2/3 | A content atom: a project, skill, technology, memory, research topic, or goal |
| `synapse` | edges | A relationship/edge between two nodes (Section 6) |

`node` carries a `kind` discriminator: `project | skill | tech | memory | research | goal | about | contact`. Kind drives icon, terminal layout, and default media.

### Hierarchy & parent-child
```
core (1)
└── region (6–8)
    └── cluster (2–5 per region)
        └── node (5–20 per cluster)            ← the leaves; ~60–200 total
            └── interior? (optional pocket scene / rich content)
synapse: cross-cutting edges between any two nodes (and region↔region tracts)
```
- **Containment** is strict (core→region→cluster→node) and drives **spatial layout + LOD**: a node only loads detail when its cluster is the active Tier-2 focus.
- **Relationships** (synapses) are **orthogonal** to containment and drive **the graph + travel** — a React `node` in Cerebellum may synapse to a project `node` in Occipital.

### Data schema (validated with Zod at build time)
```ts
// SCHEMA SHAPE — not implementation, the contract.

NodeBase {
  id: string                 // stable, slugged, used in deep-link URL
  type: 'core'|'region'|'cluster'|'node'
  kind?: 'project'|'skill'|'tech'|'memory'|'research'|'goal'|'about'|'contact'
  title: string
  subtitle?: string
  parentId: string | null    // containment
  region: RegionId           // denormalized for fast theming/lookup
  importance: 0..1           // drives size, LOD priority, shimmer, bloom weight
  position?: Vec3            // OPTIONAL: if absent, auto-laid-out at build time
  tags: string[]             // power derived synapses + search facets
  connections: string[]      // explicit curated edges (node ids)
  status?: 'live'|'wip'|'archived'|'concept'
  dateStart?: ISODate; dateEnd?: ISODate
  media?: { hero?, gallery?[], video?, model? }   // refs to optimized assets
  links?: { label, url }[]    // repo, live, paper, etc.
  content: MDXRef             // the body shown in the Information terminal
  interior?: InteriorRef      // optional pocket-scene descriptor (memory/flagship)
  fallback: { summary: string, seoTitle, seoDescription } // for 2D + crawlers
}
```
### Metadata structure
- **Render metadata** (`importance`, `region`, `status`) → drives visuals & LOD without touching content.
- **Graph metadata** (`connections`, `tags`) → build-time graph computation (Section 6).
- **Search metadata** (`title`, `tags`, `kind`, `fallback.summary`) → search index.
- **SEO/fallback metadata** (`fallback.*`, `links`) → the 2D routes & crawlers.

### Examples
```yaml
# PROJECT NODE
id: neural-canvas
type: node, kind: project
title: "Neural Canvas", subtitle: "Real-time WebGL generative art"
parentId: cluster-creative-coding, region: occipital
importance: 0.9, status: live
tags: [webgl, shaders, react, generative]
connections: [react, glsl, memory-first-shader]
media: { hero: neural-canvas/hero.ktx2, video: neural-canvas/demo.mp4 }
links: [{label: Live, url: ...}, {label: Code, url: ...}]
content: ./content/projects/neural-canvas.mdx
fallback: { summary: "A real-time generative art engine...", seoTitle: "...", seoDescription: "..." }

# SKILL NODE
id: react
type: node, kind: tech
title: "React", parentId: cluster-frontend, region: cerebellum
importance: 0.95, tags: [frontend, ui, javascript]
connections: [neural-canvas, typescript, r3f]
content: ./content/tech/react.mdx

# MEMORY NODE (tiered: this one is a flagship → has interior)
id: memory-first-shader
type: node, kind: memory
title: "The night the first shader compiled"
parentId: cluster-memories-2021, region: temporal
importance: 0.8, dateStart: 2021-03-11
interior: ./content/interiors/first-shader.scene
content: ./content/memories/first-shader.mdx
```

---

# SECTION 6 — Neural Network Design

### Two layers of connection
1. **Tracts** (region↔region): thick white-matter bundles, the highways. Few, hand-authored, always visible at Tier 0.
2. **Synapses** (node↔node): thin glowing splines, the streets. Many, partly curated + partly derived.

### How connections are generated (hybrid, build-time)
- **Curated edges:** each node's explicit `connections[]`. These are intentional, weighted highest.
- **Derived edges:** computed at build time from shared `tags`, shared `region`, temporal adjacency (memories near in time), and kind affinity (a project ↔ the tech it uses). Each derived edge gets a **weight** = f(overlap, importance).
- **Thresholding (anti-hairball):** keep only edges above a weight cutoff, and **cap out-degree** per node (e.g. top-K = 6). Without this, 200 nodes → thousands of edges → visual mush + draw-call explosion. This is mandatory.
- Output: a **static `graph.json`** (nodes + thresholded weighted edges + precomputed spline control points) shipped to the client. No graph computation at runtime.

### Layout — precomputed, never live physics
- Run a **force-directed layout offline** (in the build step, or authored by hand for hero nodes) seeded by containment (cluster centroids) so the result is anatomically plausible *and* graph-sensible. Freeze positions into the content.
- **Why not runtime physics:** live force-sim is non-deterministic, jittery, a CPU sink, and makes the world feel unstable. Precompute = stable, performant, art-directable. (A *micro* idle drift/breathing animation is fine and is pure shader-side, not physics.)

### Relationship visualization
- **Resting state:** synapses are dim, thin, barely-there — structure you sense more than see.
- **Focus state:** selecting a node lights its incident edges and **pulses a signal particle** along each toward neighbors; neighbors brighten and label; the rest of the world dims (focus+context). This is the core "neurons firing" moment.
- **Signal flow:** edges carry animated flow (a moving gradient / particle along the spline) whose direction encodes relationship direction (e.g. tech→project = "powers"). Pure shader (flow-map / time-offset along curve param) — cheap.
- **Edge geometry:** instanced/merged tube or `Line2` (fat lines) — never thousands of separate `Line` objects. Splines are CatmullRom through precomputed control points; tessellation LODs by tier.

### How users travel through them — **Neural Path Mode**
- Selecting a connected neighbor (or "travel" command) puts the camera on the **synapse spline as a rail**: it accelerates along the curve, banks slightly, signal particles streak past (the No Man's Sky warp feel), and arrives framing the destination node. This is the signature traversal verb and the reason connections feel *physical*.
- Distance/curvature drives duration; long tract travel gets a brief "warp" with motion-blur-lite; short synapse hops are quick eases. Always interruptible (ESC → drop to Orbit at current point).

### Dynamic connections
- **Contextual subgraph:** the active node's K-neighborhood is the only fully-lit graph; everything else is ambient. This keeps the scene legible and cheap.
- **Optional "thought" pulses:** ambient idle signals occasionally fire along random high-weight edges to keep the brain feeling alive (rate-limited, capped particle count).

---

# SECTION 7 — Camera Architecture

> This is the product. Treat the camera as a **single state machine with one authority**. No system mutates the camera transform except the **Camera Director**. Others emit *intents*.

### Camera Director (FSM)
States (modes), each a class/strategy implementing `enter/update/exit` and reading/writing only via the camera rig:

| Mode | Purpose | Controls | Notes |
|---|---|---|---|
| **Orbit** | Default. Orbit the current focus (a region/cluster/node). | Drag = orbit, wheel/pinch = dolly (within tier), right-drag/two-finger = pan (bounded). | Damped. The "Sketchfab" feel. The resting state. |
| **Focus** | Frame a single target, locked, gentle idle drift. | Limited orbit around target; wheel nudges tier. | Entered on node select. Terminal opens here. |
| **Travel** | Point-to-point flight between distant targets (region↔region, fast-travel). | Non-interactive during flight (skippable). | Eased `setLookAt` along a hero curve; the "Google Earth fly-to". |
| **Neural Path** | Rail-follow along a synapse/tract spline. | Throttle only (optional); ESC to drop. | The signature traversal (Section 6). |
| **Free Fly** | No Man's Sky exploration. | WASD/QE + pointer-look (drag or pointer-lock); gamepad optional. | Opt-in via toggle. Has a "level horizon / recall" button. Bounded by soft world boundary. |

### Underlying rig
- A **single perspective camera** + a **damped controller** (recommend `yomotsu/camera-controls` for its first-class smooth `setLookAt`/`fitToBox`/`dollyTo` tweening and damping — superior to stock `OrbitControls` for this). Modes are *strategies* that configure/drive this one rig; they don't each spawn cameras.
- **Neural Path** and **Travel** drive the camera by sampling a curve (`getPointAt`/`getTangentAt`) and feeding the rig a target each frame.
- **Free Fly** swaps to a velocity-integrating controller but writes to the *same* camera; on exit it hands the transform back to the damped controller cleanly (no snap).

### Transitions (the hard part — make them first-class)
- All transitions are **Director-owned async sequences** with: easing curve, duration (distance-scaled), and an interrupt policy.
- **Interruptibility:** every cinematic transition can be cancelled (ESC/click) → Director blends current velocity into the nearest interactive mode (usually Orbit) without a jump. *Never trap the user in a cutscene.*
- **Blend, don't cut:** mode changes cross-fade camera params (position, target, fov, damping) over 200–600ms. Hard cuts only inside the boot dissolve.
- Use an **authored-sequence tool (Theatre.js)** for the boot/formation and the guided tour — these are choreographed and benefit from a timeline editor. Reactive transitions (focus/travel) stay code-driven.

### State management
- A `cameraStore` (Zustand) holds: `mode`, `target` (id or vec3), `tier`, `isTransitioning`, `intentQueue`. Systems push intents (`focus(nodeId)`, `travelTo(regionId)`, `enterFreeFly()`); the Director consumes the queue, arbitrates conflicts (latest-wins with guards), and runs the rig. Camera transform itself lives on the Three object, **read transiently** (not React state) to avoid per-frame re-renders.

### "Infinite zoom" — reinterpreted as **Semantic Scale Tiers**
Literal infinite zoom is a float-precision trap with no payload. Replace with **tiered semantic zoom** (the Google Earth model):
```
wheel/pinch IN  →  crosses tier threshold  →  Director triggers a tier transition:
   Brain → Region → Cluster → Node → Interior
At each crossing:
   • camera dollies + DoF rack-focuses on the new subject
   • LOD swaps in higher detail for the subject, sheds siblings
   • HUD/breadcrumb updates; available interactions change
   • content streams in for the new tier (lazy)
```
- Between tiers, dolly is **continuous and bounded**; the *feeling* of endless zoom comes from DoF, parallax of the particle field, and the reveal of finer structure — not unbounded translation.
- For the Core, the dive *through* its shells (Section 11) gives a genuine "going infinitely inward" sensation while coordinates stay bounded.
- If a future "masterpiece" demands true vast scale, add **camera-relative rendering / origin rebasing** then — but it is **not** needed at brain scale and would be premature now.

### Motion-sickness safeguards (ship these)
- Damping floors (no instant camera snaps), capped angular/linear velocity, optional "reduce motion" mode (shortens/cuts cinematics, disables free-fly bank, reduces FOV pulsing), vignette-on-fast-move to anchor the periphery, and FOV that *narrows slightly* during fast travel (counter-intuitively reduces nausea).

---

# SECTION 8 — User Navigation

### Navigation philosophy
**"Always two ways in: wander or warp."** The world rewards exploration, but no content is ever more than one command away. Spectacle for the curious; speed for the busy. Both are first-class.

### How users move
- **Direct manipulation** (Orbit/Focus): drag to look, scroll/pinch to change tier, click/tap a node to focus. The default, learnable in 3 seconds.
- **Fast-travel:** click a region on the **minimap**, or pick a result in **spotlight** → Travel Mode flies there.
- **Graph traversal:** from a focused node, jump to a neighbor → Neural Path Mode.
- **Free exploration:** toggle Free-Fly for the No Man's Sky drift.
- **Recall:** `H` → home to Core from anywhere.

### Orientation (recap of the always-on aids)
Neural Compass + Core-as-North-Star + region color + breadcrumb (`Brain ▸ Region ▸ Cluster ▸ Node`) + minimap. The breadcrumb **is** the deep-link — the URL reflects location, so navigation is shareable and back/forward works.

### Locating information
- **Spotlight / ⌘K** (the fast lane): fuzzy search across all nodes by title/tag/kind. Enter → fly to it. This is the recruiter's best friend and the answer to "I don't want to get lost."
- **Faceted browse:** filter by kind (Projects / Skills / Memories / Goals) → matching nodes highlight + a list lets you teleport. The "show me all projects" verb.
- **Connectome map:** the zoomed-out schematic doubles as a clickable index.

### Search (Section 14 details the tech)
- Client-side index (MiniSearch/FlexSearch) built from content at load. Instant, offline, no backend.
- Searches **titles, tags, kinds, summaries, region names**. Results show region color + kind icon. Selecting drives the camera (3D) or routes (2D fallback) identically — same intent layer.
- **Command grammar** in the same input: `goto cerebellum`, `find react`, `projects`, `core`, `tour`, `freefly`. Bridges spotlight and the Command Terminal (Section 9).

### Exploration design
- **Wander loop:** ambient shimmer on undiscovered high-value nodes → curiosity → approach → ignite → discover → connections reveal → travel to a neighbor → repeat. The graph itself pulls you onward.
- **Reward:** discovering nodes fills the connectome map; completing a region unlocks a subtle visual flourish; finding the Core's inner layers reveals the manifesto/contact. Light, non-gamey progression — enough to motivate, not so much it feels like a chore.
- **Returning users:** discovery + last-location persisted; fast-boot skips the long cinematic; "continue where you left off" or "jump to Core."

---

# SECTION 9 — Terminal System

### Rendering decision
Terminals are **DOM overlays (HTML/React), not in-canvas meshes.** Rationale: crisp text at any DPR, real accessibility (focus, screen readers, copy-paste, links), trivial scroll/selection, and they don't cost GPU fill rate. They are **screen-space-anchored** to their owning 3D node when contextual (a thin connector line ties the window to its node) but live in a top DOM layer with a proper window manager. (Reserve drei `Html`/in-canvas text only for *diegetic* labels/billboards, not interactive content windows.)

### Terminal types
| Terminal | Trigger | Content/behavior |
|---|---|---|
| **Boot Terminal** | App start | The boot sequence (matches reference #4): `system_boot` → checklist (`Initializing Cognitive Kernel… [OK]` …) → `Awaiting Neural Handshake` → `PRESS ENTER`. Full-screen, then dissolves into formation. Skippable on return visits. |
| **Information Terminal** | Node focus | Renders the node's MDX content: title bar = node title, body = description/media/links/status/dates. Anchored to its node with a connector. This is where "nodes contain information." |
| **Search / Spotlight** | `⌘K` / `/` | Centered command palette: fuzzy search + command grammar. The fast lane. |
| **Command Terminal** | `~` / toggle | A real-feeling REPL: `goto`, `find`, `tour`, `freefly`, `whoami`, `ls projects`, `help`. For power users / the "hacker" flavor; everything it does is also reachable via GUI. |
| **Memory Terminal** | Inside a memory/interior | A diegetic HUD within a memory scene: narration, timeline scrubber, "exit memory." Styled to the memory's mood, not the standard chrome. |

### Window management
- A **WindowManager** owns z-order, focus, open/close, min/max, and a **max-concurrent-windows cap** (e.g. 3) to prevent clutter — opening a 4th gently closes the least-recently-used.
- Windows are **draggable, resizable, minimizable**; remember position per node within a session; snap to soft screen-edge guides; never fully off-screen.
- Multiple Information terminals can coexist (compare two projects) up to the cap.

### macOS controls
- **Traffic lights:** red = close, yellow = minimize (to a dock/tab strip), green = maximize/restore (fit content). Hover reveals glyphs, exactly like macOS.
- **Title bar:** node title + kind icon + region color accent; double-click title = maximize; drag = move.
- Subtle window chrome: translucent vibrancy/blur background, 1px inner stroke, soft shadow — premium, not skeuomorphic-heavy.

### Keyboard interactions
- `⌘K`/`/` spotlight · `~` command terminal · `ESC` close focused window → ascend one tier · `⌘W` close · `⌘M` minimize · `Tab`/`Shift+Tab` cycle windows · arrows navigate results/links · `Enter` activate · `H` home · `F` free-fly. Full keyboard operability is also an accessibility win.

---

# SECTION 10 — Memory Spaces

### What qualifies as a memory
A **memory** = a significant, *narratable* moment in the engineer's journey (first job, a formative project, a failure that taught something, a milestone). Distinct from a `project` (an artifact) — a memory is an *experience*. They live in the **Temporal Lobe**.

### Representation — **tiered** (this is the scope-control decision)
| Tier | What it is | Cost | Use for |
|---|---|---|---|
| **Tier A — Enriched Terminal** | A Memory Terminal with narration, a few images, timeline context. No new scene. | Cheap | The *majority* of memories (~80%). |
| **Tier B — Pocket Scene** | A small, lazy-loaded environment with its own lighting/mood/particles + Memory HUD. Reuses shared scene primitives, themed by params. | Moderate | A handful of important memories (~15%). |
| **Tier C — Flagship Memory** | A bespoke, fully art-directed mini-environment (e.g. "the night the first shader compiled" = a dark room, a glowing monitor, particles resolving into a shader). | Expensive | 2–4 signature memories only. |

> Recommendation: **memories ARE scenes/environments — but only at Tiers B/C, and only for a curated few.** Treating all memories as full environments is the scope-killer the brief risks. Tier the system; ship MVP with Tier A everywhere + one Tier C showpiece, add Tier B/C over time. This is exactly the "MVP now, masterpiece later" seam.

### Entering a memory
- A memory node, when focused, offers **"Enter Memory."** Selecting it plays a **dive transition**: camera pushes into the node, the brain world fades/blurs out, the pocket scene fades/forms in (a match-cut through a particle/light burst). Asset chunk for the scene is **lazy-loaded** during the dive (prefetched on focus so the transition covers load time).
- Tier A "memories" skip the dive — they just open the Memory Terminal in place.

### Exiting a memory
- **ESC / "Exit Memory"** reverses the dive: pocket scene dissolves, brain reforms around the memory node, camera returns to Focus on it. Discovery state marks it visited. The user is never stranded — exit is always one key.

### Why scenes (and why lazy)
- Memories *as environments* are where the "consciousness simulation" earns its name — they're the emotional peaks. But each is a **code-split, asset-streamed chunk**, mounted only while inside, **fully disposed on exit** (geometries/textures/materials freed) so they never tax the main brain scene. The brain world and memory scenes never coexist in GPU memory.

---

# SECTION 11 — Chanakya Core

> The nucleus. The centerpiece. The emotional and spatial climax. Everything orbits it; everything returns to it.

### Purpose
The Core is **identity + connection**: who the engineer *is* (manifesto/about), what they value, and the call-to-action (contact). Spatially it's the world's **anchor and home**. Narratively it's "the self" — the conscious center the whole brain serves.

### Symbolism
The **Dyson sphere / energy core** (reference #6): a contained singularity of energy ringed by engineered shells — *raw potential, harnessed and structured.* It reads as the source of all thought (signals flow inward to it and outward from it), and as the engineer's core intelligence. "Chanakya" as the named intelligence gives it a persona — the Core can be where the experience "speaks."

### Navigation
- **Always visible** as the brightest glow (the North Star) and **always one keystroke away** (`H` / `core`). All region tracts ultimately route through/near it — it's Grand Central.
- **Dive-through structure:** unlike other nodes, zooming the Core doesn't just frame it — you **descend through its concentric shells**, each a tier of content. This is the one place "infinite inward zoom" is literal-feeling (and bounded).

### Internal structure (concentric, divable)
```
SHELL 0  Corona / Surface      First contact: name, role, one-line thesis. The "who".
SHELL 1  Manifesto Ring        Values / philosophy as orbiting glyph-panels you pass through.
SHELL 2  Connectome Hub        Live map of the whole mind; jump anywhere. The Core as index.
SHELL 3  Singularity           Contact / CTA — "the moment of connection": email, socials,
                                "let's build" — rendered as reaching the bright center.
```
- Descending tightens DoF, raises bloom on the center, intensifies the core's hum (audio), and slows time slightly — arriving at the singularity is the climax (and the conversion moment: contact lives at the most emotionally charged point).

### Visual design
- **Layered energy core:** inner emissive singularity (noise-driven plasma shader, animated FBM, additive) + rotating engineered **shells** (semi-transparent paneled rings, slow differential rotation) + orbiting **fundamental rings** (thin bright bands) + volumetric god-rays/bloom. Warm **gold-white** against the cold indigo void — the *only* warm light source in the world, which is what makes it feel sacred and central.
- **Breathing:** the whole core pulses subtly (a heartbeat), and brightens when the user looks at it or when signals arrive — it feels *aware*.
- **Performance-bounded:** despite the spectacle, it's a small number of meshes + 2–3 shaders + capped particles + a localized bloom mask. It looks expensive; it isn't, if built with restraint.

---

# SECTION 12 — Visual Direction

> Mandate: **avoid generic-AI and cyberpunk clichés.** No matrix rain, no neon-hex grids, no Tron light-cycle lines everywhere, no rainbow holographic UI. The target mood is **"a bioluminescent deep-sea observatory rendered by an analog-warm terminal"** — organic structure, scientific calm, one sacred warm light (the Core). Restraint is the differentiator.

### Color
- **Base:** deep voidic indigo / near-black (`#070912` → `#0E1224`), not pure black — gives the haze depth.
- **Neural structure:** desaturated bioluminescent cyan-teal (`#3FD0C9` / `#5EA8FF`) as the connective tissue baseline.
- **Region accents:** the restrained hues of Section 4 — each region tints *its* lighting, never the whole scene. Limited palette, low saturation, high value-contrast.
- **The one warm:** gold-white reserved **exclusively** for the Chanakya Core (and signal "arrivals"). Scarcity = meaning. This single rule prevents the rainbow-cyberpunk look.

### Materials
- **Brain tissue / structures:** translucent, depth-faded, **Fresnel rim-lit** (bright at grazing angles, hollow-feeling), faint internal subsurface glow. Think frosted bioluminescent glass, not chrome.
- **Synapses:** additive emissive flow-mapped lines — light, not solid.
- **Void/space:** pure matte; the darkness does work.
- **Core shells:** thin paneled translucency with subtle iridescent fresnel; the singularity is pure additive plasma.

### Lighting
- **Emissive-driven**, not lamp-driven. The structures *emit*; a minimal cool key + the Core's warm bounce do the rest. A subtle environment (low-intensity HDRI or gradient) grounds the fresnel. This keeps it dimensional without flat "studio" lighting.

### Atmosphere
- **Volumetric depth haze / fog** (distance fade) for parallax and that "vast interior space" feeling. **Neural dust** — a slow ambient particle field with parallax — sells scale and life. Everything **breathes** (global slow sine on emissive intensity) so the brain feels alive, never static.

### Typography
- **Terminals/UI:** a precise, characterful **monospace** (Berkeley Mono / JetBrains Mono / Geist Mono) — the analog-warm computer voice.
- **Diegetic labels / content headings:** a clean **humanist sans** (Inter / Geist Sans) for readability.
- Restrained type scale, generous spacing, terminal-green only inside the boot/command terminals (not the whole UI).

### Motion language
- **Organic & eased** — nothing linear, nothing snappy. Breathing, drifting, pulsing. Signals flow; structures sway micro-amounts. Camera always damped. The vocabulary is *biological + celestial*, not *mechanical + glitchy*. **No glitch/datamosh effects** — that's the cliché to avoid.

### Particle systems
- **Formation sequence** (reference #7): particles → neural points → connections → outline → structure → complete brain. A GPU-driven one-shot at boot (instanced points + a dissolve/assembly shader animating from noise to target positions).
- **Ambient:** neural dust field (capped count, parallax).
- **Signals:** flow particles along synapses (Section 6).
- All particles **capped and soft-clamped** by the PerformanceMonitor (Section 15) — fill rate is the enemy.

### Post-processing
- **Selective bloom** (emissive-masked, so only structures/Core bloom — not the whole frame washing out), at **half-resolution** buffer.
- **Tier-based depth of field** (the "zoom" feel; gentle, not gimmicky).
- **Subtle vignette** (anchors periphery, aids comfort) + **very light film grain** (kills banding in the haze, adds analog texture).
- **Light chromatic aberration** only at screen edges during fast travel — barely perceptible.
- **AA:** SMAA (or TAA if temporal stability of particles demands it). 
- *Avoid:* heavy chromatic aberration, scanlines, glitch passes, lens flares everywhere — the cliché stack.

### Shaders (the bespoke set — added progressively)
Fresnel rim + depth-fade (structures) · flow-map signal (synapses) · FBM plasma (Core singularity) · particle assembly/dissolve (formation) · soft additive dust · ignite/reveal (discovery). Each is small and focused; resist the urge to make everything bespoke in the MVP.

---

# SECTION 13 — Reference Package

Organized by subsystem. (Searches are phrased as you'd actually query ArtStation / Behance / Awwwards / YouTube.)

### Boot & Terminal
- **Searches:** "macOS terminal UI design", "warp ghostty terminal aesthetic", "sci-fi boot sequence UI", "diegetic OS interface".
- **Films/Games:** *Alien: Isolation* (MU-TH-UR terminals), *Ghost in the Shell* (dive interfaces), *Tron: Legacy* (restraint version — the typography, not the neon).
- **Sites/Studios:** Vercel/Geist design language, Warp.dev, Raycast (command palette UX).

### Brain world & formation
- **Searches:** "neural connectome visualization", "Human Connectome Project render", "particle brain formation Houdini", "point cloud brain glsl".
- **Artists:** Refik Anadol (data sculptures), Joey Camacho (Raw & Rendered), Maxim Zhestkov (particle systems).
- **Reference:** Human Connectome Project, BrainGL, fMRI tractography imagery.

### Navigation & camera
- **Games:** *No Man's Sky* (warp, galaxy map, free-fly), *Outer Wilds* (orientation in space, wonder), *Elite Dangerous* / *EVE Online* star map (fast-travel + node graph), *Astroneer* (readable stylized space).
- **Web:** Google Earth (fly-to), Sketchfab viewer (orbit feel), Cesium.js.
- **Lib reference:** yomotsu/camera-controls demos.

### Neural graph & travel
- **Searches:** "force directed graph 3d webgl", "synapse signal flow shader", "warp tunnel spline camera".
- **Reference:** Observable/D3 force graphs (for layout intuition only — not runtime), *Tron* light-rail traversal (motion, not look).

### Memory spaces
- **Films:** *Inside Out* (memory orbs — the concept, not the look), *Arrival* (heptapod calm), *Annihilation* "the Shimmer" (dissolve/reform transitions), *Eternal Sunshine* (memory dissolving).
- **Games:** *Outer Wilds* (environmental storytelling), *Gris* (mood-as-environment), *What Remains of Edith Finch* (memory vignettes).

### Chanakya Core
- **Films:** *Interstellar* (tesseract — going inward), *Sunshine* (the sun as sacred destination), *Ex Machina* (contained intelligence).
- **Searches:** "dyson sphere render", "energy core vfx", "stellar engine concept art", "FBM plasma shader".

### Overall art direction & web craft
- **Studios:** Active Theory, Lusion, Resn, Bruno Simon (threejs-journey), Hello Monday, ManvsMachine.
- **Awards:** Awwwards SOTD WebGL winners, FWA, Codrops demos, pmndrs (R3F) showcase.
- **Mood anti-references (what to NOT look like):** generic "AI brain" stock renders, Tron neon overload, matrix rain, glitch-cyberpunk UI kits.

---

# SECTION 14 — Technical Architecture

| Layer | Recommendation | Why |
|---|---|---|
| **Framework / shell** | **Next.js (App Router) + TypeScript** | SSR'd, crawlable 2D fallback routes + per-node deep-link pages satisfy the "convert/SEO/hybrid" mandate for free. The 3D world is a **client-only island** (`dynamic(..., { ssr:false })`). *Alt considered:* Vite SPA + prerender — lighter, but you'd rebuild SSR/SEO by hand; rejected given the hybrid requirement. |
| **3D runtime** | **React Three Fiber + drei + three.js** | Declarative scene graph integrates with React for the DOM terminal layer; drei gives batteries (loaders, instancing, perf monitor). Industry standard for exactly this. |
| **Rendering pipeline** | R3F render loop with **`@react-three/postprocessing`**; **adaptive DPR** via drei `PerformanceMonitor`; **`frameloop="demand"`** during static/terminal-focused states, continuous during motion. | Caps GPU cost; lets effects scale down on tablets automatically. |
| **Camera** | **yomotsu/camera-controls** as the rig + a custom **Camera Director FSM**; **Theatre.js** for authored sequences (boot, tour). | Best-in-class damped tweening; Theatre gives a timeline editor for cinematics without hardcoding. |
| **State** | **Zustand** (sliced stores) + a tiny **event bus** for intents; transient/per-frame data read off refs, not React state. | Works outside React render, no re-render storms, the R3F-community standard. |
| **Data layer** | Typed **MDX content** + **Zod** validation → build-time **graph generation** (layout + thresholded edges) → static `graph.json`. Optional later: **Sanity/Contentlayer** CMS. | One source of truth, validated, no runtime graph compute. CMS deferred to "masterpiece later." |
| **Search** | **MiniSearch** (or FlexSearch) client index built at load. | Instant, offline, no backend; powers spotlight + command grammar. |
| **Animation** | camera-controls + Theatre.js (cinematics) + **react-spring/Framer Motion** (DOM windows/UI) + GLSL (in-shader motion). | Right tool per layer; avoids one lib doing everything badly. |
| **Asset pipeline** | **glTF + Draco/Meshopt** compression, **KTX2/Basis** textures, **gltfjsx** for typed components, **gltf-transform** in CI; sprite/texture atlases. | Minimizes bytes + draw calls; reproducible optimization. |
| **Content pipeline** | MDX → validate (Zod) → emit graph + search index + **fallback pages** (SSR) in one build step. | Authoring once populates 3D + 2D + search + SEO. |
| **Audio** (recommended add) | **Howler.js** or WebAudio: ambient hum, UI ticks, Core heartbeat, travel whoosh. | Sound is 50% of "alive." Cheap, huge immersion ROI. Behind a mute + autoplay-gate. |
| **Tooling/quality** | TS strict, ESLint/Prettier, Vitest + Playwright (smoke), Storybook for terminal/UI components, CI asset budget check. | Maintainability for a multi-system app. |

**Rendering pipeline shape:** one `<Canvas>` (the brain) + a DOM overlay layer (terminals/HUD) synced via screen-space projection. The canvas mounts only after boot ENTER. Memory scenes mount as **suspense-boundaried, code-split** sub-scenes that replace the brain scene's render content while active.

---

# SECTION 15 — Performance Strategy

**Targets:** 60fps desktop (mid laptop incl. integrated GPUs), **≥40–60fps modern tablet**, graceful auto-degrade below. Phones → 2D fallback (not negotiated down to broken 3D).

### Hard budgets (enforce from commit #1, check in CI/dev HUD)
| Budget | Target |
|---|---|
| Draw calls | < ~150 (desktop), < ~90 (tablet via LOD) |
| Triangles | < ~1.5M visible |
| Particles | < ~50k desktop / ~20k tablet, hard-capped by PerformanceMonitor |
| Postprocessing | bloom/DoF at **0.5–0.75×** resolution |
| Texture memory | < ~256MB GPU; KTX2 everywhere |
| Bundle (3D island) | code-split per region/memory; initial < ~1.5MB JS gz |

### LOD strategy (tied to scale tiers, Section 7)
- **Tier-gated detail:** Tier 0 shows region impostors/low-poly + billboard labels; node detail meshes only instantiate when their cluster is the active Tier-2. Synapse spline tessellation scales with tier. This is the biggest single win.
- **Distance LOD** within a tier for node meshes (drei `<Detailed>`).
- **Impostors/billboards** for far nodes and the dust field.

### Instancing & merging
- **All nodes of a type → one `InstancedMesh`** (per-instance color/scale/importance via instanced attributes). 200 nodes = a handful of draw calls, not 200.
- **Synapses → merged geometry / `Line2` batches**, not per-edge objects.
- **Dust/signals → GPU points** with custom shaders, single draw call each.

### Culling
- Frustum culling (default) + **tier culling** (don't even mount off-tier detail) + **occlusion-lite** (skip nodes fully behind the Core/dense haze beyond a distance). Region detail unmounts when you leave the region.

### Lazy loading
- Regions and memory scenes are **code-split chunks**, prefetched on approach/focus (so transitions cover load latency), mounted on enter, **disposed on exit** (geometries/materials/textures freed — verify with a leak check). Content MDX/media stream per node on focus.

### Memory management
- Central **dispose discipline:** every dynamically-mounted scene chunk owns and frees its GPU resources on unmount. Texture atlases to limit texture count. Reuse shared materials/geometries via a small asset cache. Watch the classic R3F leak: detached materials/render targets from postprocessing on hot-reload.

### GPU optimization
- **Fill rate is the #1 enemy** (additive particles + transparency + bloom). Mitigate: cap particles, half-res bloom, limit overlapping transparent layers, soft-particle depth fade instead of brute overdraw, avoid full-screen transparency stacks.
- **Minimize transparency sorting** (instanced additive doesn't sort — prefer it; keep true alpha-blend objects few and depth-pre-sorted).
- **`frameloop="demand"`** when idle/reading a terminal → near-zero GPU, big battery win on tablets.
- **Adaptive quality:** drei `PerformanceMonitor` steps DPR + particle count + post-effect quality up/down to hold framerate. Define explicit quality tiers (Ultra/High/Medium/Low) and a manual override in settings.
- **Capability gate at boot:** detect GPU/WebGL2/memory; if below threshold → offer the 2D experience instead of a janky 3D one.

---

# SECTION 16 — Folder Structure

Architecture only — responsibilities, not code. (Next.js App Router layout.)

```
inside-the-mind/
├─ app/                          # Next.js routes (shell + SSR fallback + SEO)
│  ├─ (experience)/page.tsx      # mounts the 3D client island (ssr:false)
│  ├─ explore/[nodeId]/page.tsx  # SSR'd 2D fallback per node = deep-link + crawlable
│  ├─ explore/page.tsx           # 2D index of all nodes (the structured fallback home)
│  ├─ sitemap.ts / robots.ts     # SEO surface generated from the content graph
│  └─ layout.tsx, og/            # metadata, OpenGraph image gen
│
├─ src/
│  ├─ three/                     # ENGINE: <Canvas> setup, render loop, post stack,
│  │                             #   adaptive perf, capability gate. R3F plumbing only.
│  ├─ world/                     # WORLD: scene assembly, tiers, fog/atmosphere,
│  │                             #   discovery/fog-of-cognition, world bounds, minimap data.
│  ├─ brain/                     # BRAIN: region volumes, anatomy layout, formation
│  │                             #   sequence, region theming, hemisphere current.
│  ├─ nodes/                     # NODE SYSTEM: instanced node renderer, node visuals,
│  │                             #   hover/select, ignite/reveal, LOD, billboards.
│  ├─ graph/                     # NEURAL GRAPH: edge rendering (Line2/merged), signal
│  │                             #   flow shaders, subgraph highlight, path sampling.
│  ├─ camera/                    # CAMERA DIRECTOR: FSM, mode strategies (orbit/focus/
│  │                             #   travel/neuralpath/freefly), transitions, intents.
│  ├─ terminal/                  # TERMINAL SYSTEM: WindowManager, terminal types
│  │                             #   (boot/info/search/command/memory), macOS chrome.
│  ├─ navigation/               # NAV: spotlight/command grammar, compass, breadcrumb,
│  │                             #   minimap UI, fast-travel intents, URL<->location sync.
│  ├─ memory/                    # MEMORY SPACES: dive/exit transitions, pocket-scene
│  │                             #   framework (Tier A/B/C), per-memory chunks (code-split).
│  ├─ core/                      # CHANAKYA CORE: shells, singularity shader, dive-through
│  │                             #   tiers, manifesto/contact content surfaces.
│  ├─ boot/                      # BOOT SYSTEM: boot terminal, ENTER handoff, dissolve.
│  ├─ state/                     # Zustand slices: camera, world, selection, terminals,
│  │                             #   navigation, content, settings + the event bus.
│  ├─ content/                   # CONTENT API: load/validate graph + search index;
│  │                             #   the only module that reads raw content. Typed accessors.
│  ├─ shaders/                   # GLSL: fresnel, flow, plasma, assembly, dust, ignite.
│  ├─ systems/                   # cross-cutting: audio, analytics, perf monitor, a11y/
│  │                             #   reduce-motion, persistence (discovery/last-location).
│  ├─ ui/                        # shared DOM UI primitives (windows, buttons, HUD bits).
│  └─ lib/                       # math/curves, screen-space projection, easing, helpers.
│
├─ content/                      # AUTHORING: nodes/*.mdx, regions/, memories/,
│  │                             #   interiors/, tech/, projects/ + schema (Zod).
│  └─ schema.ts                  # the node/edge contract (Section 5).
│
├─ scripts/                      # BUILD: graph generation (layout + thresholded edges),
│  │                             #   search-index build, asset optimization (gltf-transform).
│
├─ public/assets/                # optimized glTF (Draco/Meshopt), KTX2 textures, audio.
└─ docs/                         # this blueprint, ADRs, budgets, content authoring guide.
```
**Guiding rule:** systems talk through `state/` + the event bus and the `content/` API — **not** direct cross-imports. That decoupling is what lets the "masterpiece" versions of `camera/`, `core/`, `memory/` replace the MVP versions without touching their neighbors.

---

# SECTION 17 — Implementation Phases

> Sequenced so a *genuinely good* experience ships at Phase 1, and each later phase layers in without rewriting earlier seams.

### Phase 0 — Foundations & Skeleton
- **Goals:** repo, Next+TS+R3F, CI (lint/type/asset-budget), content schema + Zod, build script stub, design tokens, capability gate, empty 2D fallback routes, Zustand + event-bus skeleton, Camera Director **interface** (modes stubbed).
- **Deliverables:** runnable shell; one placeholder node renders in 3D *and* at `/explore/[id]`; performance HUD.
- **Dependencies:** none.
- **Risks:** Next+R3F SSR boundary friction. **Mitigation:** lock the client-island pattern early; don't fight SSR for the canvas.
- **Complexity:** Low–Med.

### Phase 1 — Vertical Slice (the shippable MVP)
- **Goals:** Boot terminal → ENTER → dissolve → particle formation → brain forms → **one fully-built region** (e.g. Cerebellum) with instanced nodes → Orbit + Focus camera → Information terminal → spotlight (⌘K) fast-path → working 2D fallback for those nodes → deep-link sync.
- **Deliverables:** an end-to-end experience for one region that already feels real and converts (you can find & read a project, and share its link).
- **Dependencies:** Phase 0.
- **Risks:** camera feel; formation perf. **Mitigation:** spike camera-controls + Director first; cap particles immediately.
- **Complexity:** **High** (this is the make-or-break phase).

### Phase 2 — Full World & Navigation
- **Goals:** all regions + clusters; full Camera Director (Travel, Neural Path, Free-Fly); precomputed neural graph + signal flow; compass + breadcrumb + minimap; command terminal + full command grammar; discovery/persistence; guided tour.
- **Deliverables:** the complete navigable brain with all content reachable by wander *and* warp.
- **Dependencies:** Phase 1 camera + graph foundations.
- **Risks:** disorientation; edge hairball; window-manager complexity. **Mitigation:** edge thresholding + K-cap; ship orientation aids *with* the world, not after.
- **Complexity:** High.

### Phase 3 — Chanakya Core & Memory Spaces
- **Goals:** the Core (shells, singularity, dive-through tiers, manifesto+contact); memory framework Tier A everywhere + 1 Tier-C flagship; dive/exit transitions; Memory Terminal.
- **Deliverables:** the emotional centerpiece + the signature memory; the conversion climax (contact at the singularity).
- **Dependencies:** camera transitions (P2), code-split/dispose discipline (P0).
- **Risks:** memory scope creep; chunk load/dispose leaks. **Mitigation:** tier hard; one flagship only; leak-test disposal.
- **Complexity:** Med–High.

### Phase 4 — Visual Mastery & Sound
- **Goals:** bespoke shader set (fresnel/flow/plasma/assembly/ignite), selective bloom + DoF + grain tuning, breathing/motion polish, audio (hum/heartbeat/whoosh/UI), Tier-B memories.
- **Deliverables:** the "masterpiece" coat of paint; the alive, premium feel.
- **Dependencies:** stable systems from P1–P3 (paint last).
- **Risks:** effect cost regressions. **Mitigation:** budgets + PerformanceMonitor gating already in place from P0.
- **Complexity:** Med (high craft, low structural risk if seams held).

### Phase 5 — Hardening, Accessibility, Launch
- **Goals:** tablet tuning + adaptive tiers, reduce-motion/a11y/keyboard pass, SEO/OG/sitemap from graph, analytics + funnel (does it convert?), cross-browser/device QA, content fill-out to full 60–200 nodes, returning-user fast-boot.
- **Deliverables:** production launch.
- **Dependencies:** all prior.
- **Risks:** real-device perf surprises; content authoring backlog. **Mitigation:** test on real iPad/low-end laptop continuously from P1, not at the end; authoring guide + schema make content fill-out parallelizable.
- **Complexity:** Med.

---

# SECTION 18 — Risk Review

### Technical
- **Camera FSM complexity** (highest). *Mitigation:* single authority, mode-strategy pattern, spike in P1, interruptible transitions, real-device feel-testing early.
- **Next.js + heavy WebGL SSR friction.** *Mitigation:* strict client-island boundary; never SSR the canvas.
- **Asset/memory leaks** from mount/dispose of memory & region chunks. *Mitigation:* central dispose discipline, leak tests, owning-chunk pattern.
- **Float precision / "infinite zoom".** *Mitigation:* bounded world + semantic tiers; origin-rebasing only if a future scale demands it (it won't at brain scale).

### UX
- **Disorientation / getting lost** (kills the experience). *Mitigation:* the full orientation stack (compass, Core north-star, breadcrumb, minimap, recall, bounded world, fast-travel).
- **Motion sickness.** *Mitigation:* damping floors, FOV-narrow-on-travel, vignette, reduce-motion mode.
- **Content buried under spectacle / slow time-to-content for recruiters.** *Mitigation:* ⌘K spotlight + command grammar + deep links + 2D fallback as day-one fast lane; guided tour; "skip to contact."
- **Second-visit fatigue.** *Mitigation:* skippable/fast-boot, persisted discovery, "continue."

### Performance
- **Fill-rate blowout** (particles/transparency/bloom). *Mitigation:* budgets from commit #1, half-res post, capped/instanced particles, PerformanceMonitor adaptive quality.
- **Tablet GPUs.** *Mitigation:* explicit quality tiers, `frameloop="demand"` idle, continuous real-iPad testing, capability gate → 2D for the weakest.
- **Draw-call sprawl.** *Mitigation:* instancing/merging mandatory for nodes & edges.

### Overengineering
- **Live force-directed physics** — *don't.* Precompute.
- **GPGPU / true infinite zoom / bespoke-everything-shaders in MVP** — defer to Phase 4+ behind stable seams.
- **A custom windowing system gold-plated too early** — start with the cap + the 3 needed terminals; expand only if used.

### Scope
- **Memory scenes ballooning** — the project's biggest scope risk. *Mitigation:* Tier A/B/C, one flagship for MVP.
- **Content authoring burden** — *Mitigation:* schema + authoring guide + the build pipeline; fallback summaries are short; fill out incrementally (the world works at 20 nodes and at 200).
- **"Both 3D and 2D = two products" cost.** *Mitigation:* the single-source content graph means the 2D layer is mostly *generated*, not separately designed.

---

# SECTION 19 — Final Verdict

**Would I approve this architecture? — Yes, with conditions.** As an *architecture*, this is sound and ambitious in the right places. The metaphor is strong, the system decomposition is clean, the seams support the "MVP-now/masterpiece-later" path, and the dual-layer content strategy resolves the central impress-vs-convert tension. I would greenlight Phase 0/1.

**But be brutally honest about what this actually is:** building a navigable 3D world is **5–10× the effort of an excellent conventional portfolio**, and the marginal hiring/conversion benefit over a *merely great* 2D portfolio is real but not 10×. This is justified **only if** the goal is to demonstrate exactly the rare skills (R3F, shaders, systems design, performance engineering, taste) that this build itself proves — in which case the artifact *is* the portfolio and the ROI flips strongly positive. Go in with that framing or the cost/benefit will feel wrong by Phase 3.

**What I would change/lock before a line of feature code is written:**
1. **Camera Director is a hard prerequisite, not a feature.** Spike and prove the feel in Phase 1. If the camera isn't joyful, stop and fix it before anything else — everything rides on it.
2. **Commit to the single-source content graph feeding 3D + 2D + search + SEO.** Make the fallback *generated*, first-class, and crawlable from day one. This is what makes it a product, not a demo.
3. **Build the fast lane (⌘K + command grammar + deep links) in Phase 1, alongside the world** — never ship a version where a recruiter can get lost. The world is for wonder; the fast lane is for the hire.
4. **Reinterpret "infinite zoom" as semantic tiers. Precompute the graph. No live physics.** Lock these three so no one builds the trap versions.
5. **Tier the memory system and cap MVP at one flagship.** This is the scope valve that keeps the project finishable.
6. **Enforce performance budgets and real-iPad testing from commit #1**, not as a Phase 5 cleanup.
7. **Define the success metric:** e.g. "a recruiter reaches a project + contact in < 30s via the fast lane, *and* a curious visitor explores for > 3 min." Instrument it. If the build can't hit both, the concept needs trimming, not more features.

**The one thing most likely to kill this project** is not rendering or performance — it's **scope and disorientation**. Mitigate scope with phasing + memory tiers; mitigate disorientation with the orientation stack + fast lane. Do those two things, hold the system seams, and this becomes a genuinely exceptional, memorable, *and* effective piece of work.

**Verdict: Approved to begin Phase 0, conditioned on the seven changes above being baked into the plan before Phase 2.**

---

## Note on this document
This is a **planning artifact only** — no implementation code, components, React, or Three.js was written, per the brief. It is intended as the blueprint a team executes against. Next concrete step (when you're ready to build): stand up Phase 0 and spike the Camera Director feel.
