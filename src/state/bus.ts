/**
 * Event bus skeleton (Blueprint §2 / §16 — "systems talk through state + the
 * event bus, not direct cross-imports"). Reserved for transient, one-shot
 * intents that aren't naturally reactive state (e.g. a camera re-frame pulse).
 */
type Handler<T> = (payload: T) => void;

interface BusEvents {
  "camera:recenter": void;
  "camera:flyToNode": { nodeId: string };
}

type EventKey = keyof BusEvents;

// Storage is intentionally loose; the public on/emit API stays fully typed.
const listeners = new Map<EventKey, Set<Handler<any>>>();

export function on<K extends EventKey>(
  key: K,
  handler: Handler<BusEvents[K]>,
): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set<Handler<any>>();
    listeners.set(key, set);
  }
  set.add(handler);
  return () => {
    listeners.get(key)?.delete(handler);
  };
}

export function emit<K extends EventKey>(key: K, payload: BusEvents[K]): void {
  listeners.get(key)?.forEach((h) => h(payload));
}

export const bus = { on, emit };
