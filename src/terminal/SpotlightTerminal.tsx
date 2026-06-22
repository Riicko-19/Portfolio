"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { getSearchDocs } from "@/content";
import { useMind } from "@/state/store";

/**
 * Spotlight / ⌘K (Blueprint §8 fast-lane, §9 Search Terminal). Client-side
 * MiniSearch over the content docs; selecting a result focuses the camera and
 * opens its Information terminal. The "wander OR warp" fast path.
 */
interface Row {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  region: string;
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
      storeFields: ["title", "subtitle", "region", "kind"],
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 3, tags: 2 } },
    });
    ms.addAll(docs);
    return ms;
  }, [docs]);

  const results: Row[] = useMemo(() => {
    if (!q.trim()) {
      return docs.slice(0, 8).map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        kind: d.kind,
        region: d.region,
      }));
    }
    return mini.search(q).slice(0, 8).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      subtitle: (r.subtitle as string) ?? "",
      kind: r.kind as string,
      region: r.region as string,
    }));
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

  const choose = (id: string) => {
    select(id);
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
      if (r) choose(r.id);
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
          placeholder="Search the mind…  (try: react, shaders, ml)"
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
              key={r.id}
              className={`sr ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r.id)}
            >
              <span className="sr-title">{r.title}</span>
              <span className="sr-meta">
                {r.kind} · {r.region}
              </span>
            </button>
          ))}
        </div>
        <div className="spotlight-foot">↑↓ navigate · ↵ select · esc close</div>
      </div>
    </div>
  );
}
