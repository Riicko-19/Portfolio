"use client";

import Link from "next/link";
import { getNode, getNeighbourIds } from "@/content";
import { useMind } from "@/state/store";

/**
 * Information terminal body (Blueprint §9) — renders a node's content. Bound to
 * a window by the WindowManager. Connected-node buttons re-select (re-focus the
 * camera), and "View as page" links to the SSR fallback (deep link).
 */
export default function InformationTerminal({ nodeId }: { nodeId: string }) {
  const node = getNode(nodeId);
  const select = useMind((s) => s.select);
  if (!node) return null;
  const neighbours = getNeighbourIds(nodeId);

  return (
    <div className="info">
      <div className="info-head">
        {node.kind && <span className="info-kind">{node.kind}</span>}
        {node.status && (
          <span className={`info-status s-${node.status}`}>{node.status}</span>
        )}
      </div>
      <h2 className="info-title">{node.title}</h2>
      {node.subtitle && <div className="info-sub">{node.subtitle}</div>}
      <p className="info-body">{node.content}</p>

      {node.tags.length > 0 && (
        <div className="info-tags">
          {node.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {node.links.length > 0 && (
        <div className="info-links">
          {node.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>
      )}

      {neighbours.length > 0 && (
        <div className="info-conns">
          <div className="info-conns-label">Connected</div>
          <div className="info-conns-list">
            {neighbours.map((id) => {
              const n = getNode(id);
              return n ? (
                <button
                  key={id}
                  className="conn"
                  onClick={() => select(id)}
                >
                  {n.title}
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      <Link className="info-page" href={`/explore/${node.id}`}>
        View as page ↗
      </Link>
    </div>
  );
}
