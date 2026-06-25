"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { getSearchDocs, REGION_LIST } from "@/content";
import { useMind } from "@/state/store";
import { bus } from "@/state/bus";

/**
 * Spotlight / ⌘K (Blueprint §8; Phase 2 §6). Fuzzy search across nodes AND
 * regions. Selecting a node focuses it + opens its terminal; selecting a
 * region fast-travels there. The "wander OR warp" fast path.
 */
interface Row {
  type: "node" | "region";
  id: string;
  title: string;
  meta: string;
  color?: string;
}

export default function SpotlightTerminal() {
  const open = useMind((s) => s.spotlightOpen);
  const setSpotlight = useMind((s) => s.setSpotlight);
  const select = useMind((s) => s.select);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const docs = useMemo(() => getSearchDocs(), []);
  const mini = useMemo(() => {
    const ms = new MiniSearch({
      fields: ["title", "subtitle", "tags", "summary", "kind"],
      storeFields: ["title", "kind", "region"],
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 3, tags: 2 } },
    });
    ms.addAll(docs);
    return ms;
  }, [docs]);

  const results: Row[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    // Regions first.
    const regions: Row[] = REGION_LIST.filter((r) =>
      query
        ? r.name.toLowerCase().includes(query) ||
          r.domain.toLowerCase().includes(query) ||
          r.id.includes(query)
        : false,
    )
      .slice(0, 3)
      .map((r) => ({
        type: "region",
        id: r.id,
        title: r.name,
        meta: r.domain,
        color: r.color,
      }));

    const nodeRows: Row[] = (
      query
        ? mini.search(q).slice(0, 8)
        : docs.slice(0, 6).map((d) => ({ id: d.id, title: d.title, kind: d.kind, region: d.region }))
    ).map((r) => ({
      type: "node" as const,
      id: r.id as string,
      title: r.title as string,
      meta: `${r.kind as string} · ${r.region as string}`,
    }));

    return [...regions, ...nodeRows].slice(0, 9);
  }, [q, mini, docs]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const choose = (row: Row) => {
    if (row.type === "region") {
      if (row.id === "core") bus.emit("camera:recenter", undefined);
      else bus.emit("camera:frameRegion", { regionId: row.id });
    } else {
      select(row.id);
    }
    setSpotlight(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) choose(r);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSpotlight(false);
    }
  };

  return (
    <div className="spotlight-backdrop" onMouseDown={() => setSpotlight(false)}>
      <div className="spotlight" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="spotlight-input"
          placeholder="Search the mind…  (nodes & regions — try: research, chanakya, python)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="spotlight-results">
          {results.length === 0 && (
            <div className="spotlight-empty">No matches</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}`}
              className={`sr ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r)}
            >
              <span className="sr-title">
                {r.type === "region" && (
                  <span
                    className="sr-region-dot"
                    style={{ background: r.color }}
                  />
                )}
                {r.title}
              </span>
              <span className="sr-meta">
                {r.type === "region" ? `region · ${r.meta}` : r.meta}
              </span>
            </button>
          ))}
        </div>
        <div className="spotlight-foot">↑↓ navigate · ↵ go · esc close</div>
      </div>
    </div>
  );
}
