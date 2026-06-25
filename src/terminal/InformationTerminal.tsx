"use client";

import Link from "next/link";
import { getNode, getNeighbourIds, getRegion, getDegree } from "@/content";
import { useMind } from "@/state/store";

/**
 * Information terminal (Blueprint §9; Issue 6) — a "knowledge console", not a
 * tooltip. Strong type hierarchy, a metadata grid, section headers, and a
 * structured Connected-Nodes list. Connection buttons re-select (re-focus the
 * camera); "View as page" links to the SSR fallback.
 */
function Stars({ value }: { value: number }) {
  const n = Math.max(1, Math.round(value * 5));
  return (
    <span className="stars">
      {"★".repeat(n)}
      <span className="stars-off">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function InformationTerminal({ nodeId }: { nodeId: string }) {
  const node = getNode(nodeId);
  const beginTravel = useMind((s) => s.beginTravel);
  if (!node) return null;
  const region = getRegion(node.region);
  const neighbours = getNeighbourIds(nodeId);
  const degree = getDegree(nodeId);

  return (
    <div className="info">
      <div className="info-breadcrumb">
        Brain <span className="bc-sep">▸</span>{" "}
        <span style={{ color: region?.color }}>{region?.name}</span>{" "}
        <span className="bc-sep">▸</span> {node.title}
      </div>
      <div className="info-head">
        {node.kind && <span className="info-kind">{node.kind}</span>}
        {node.status && (
          <span className={`info-status s-${node.status}`}>{node.status}</span>
        )}
        {region && (
          <span className="info-region" style={{ color: region.color }}>
            ◖ {region.name}
          </span>
        )}
      </div>

      <h2 className="info-title">{node.title}</h2>
      {node.subtitle && <div className="info-sub">{node.subtitle}</div>}

      <div className="info-meta">
        <div className="meta-cell">
          <span className="meta-k">Type</span>
          <span className="meta-v">{node.kind ?? "node"}</span>
        </div>
        <div className="meta-cell">
          <span className="meta-k">Importance</span>
          <span className="meta-v">
            <Stars value={node.importance} />
          </span>
        </div>
        <div className="meta-cell">
          <span className="meta-k">Connections</span>
          <span className="meta-v">{degree}</span>
        </div>
        <div className="meta-cell">
          <span className="meta-k">Status</span>
          <span className="meta-v">{node.status ?? "—"}</span>
        </div>
      </div>

      <div className="info-section">
        <div className="section-h">Overview</div>
        <p className="info-body">{node.content}</p>
      </div>

      {node.tags.length > 0 && (
        <div className="info-section">
          <div className="section-h">Tags</div>
          <div className="info-tags">
            {node.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {neighbours.length > 0 && (
        <div className="info-section">
          <div className="section-h">Connected Nodes · {neighbours.length}</div>
          <div className="conn-list">
            {neighbours.map((id) => {
              const n = getNode(id);
              if (!n) return null;
              const r = getRegion(n.region);
              return (
                <button
                  key={id}
                  className="conn-row"
                  onClick={() => beginTravel(id)}
                  title={`Travel to ${n.title}`}
                >
                  <span
                    className="conn-dot"
                    style={{ background: r?.color ?? "#3fd0c9" }}
                  />
                  <span className="conn-name">{n.title}</span>
                  <span className="conn-kind">{n.kind}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {node.links.length > 0 && (
        <div className="info-section">
          <div className="section-h">Links</div>
          <div className="info-links">
            {node.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      <Link className="info-page" href={`/explore/${node.id}`}>
        View as page ↗
      </Link>
    </div>
  );
}
