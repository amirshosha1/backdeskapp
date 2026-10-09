/**
 * Saves the latest value about one second after the last change (Q2 of
 * Batch 3 PR B): one save at a time, the latest value wins, and a failure
 * keeps the value and says so until a retry or the next change succeeds.
 * The status drives the visible "saving / saved / not saved" line, so a
 * failed save is never silent.
 */

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "failed";

export const AUTOSAVE_DELAY_MS = 1000;

export interface Autosave<T> {
  /** A new value to save: restarts the delay. */
  schedule(value: T): void;
  /** Saves now if anything is waiting (leaving the screen, hiding the tab, retry). */
  flush(): Promise<void>;
  /** Stops the timer; a pending value is saved first. */
  dispose(): Promise<void>;
  status(): SaveStatus;
}

export function createAutosave<T>(
  save: (value: T) => Promise<boolean>,
  onStatus: (status: SaveStatus) => void,
  delayMs = AUTOSAVE_DELAY_MS,
): Autosave<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: T | undefined;
  let dirty = false;
  let running: Promise<void> | null = null;
  let current: SaveStatus = "idle";

  const set = (next: SaveStatus) => {
    if (next === current) return;
    current = next;
    onStatus(next);
  };
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  // Saves until nothing is waiting. A change made during a save is saved
  // right after it; a failure stops, keeping the latest value for a retry.
  async function drain(): Promise<void> {
    while (dirty) {
      dirty = false;
      set("saving");
      let ok = false;
      try {
        ok = await save(latest as T);
      } catch {
        ok = false;
      }
      if (!ok && !dirty) {
        dirty = true;
        set("failed");
        return;
      }
    }
    set("saved");
  }

  async function flush(): Promise<void> {
    clearTimer();
    if (running) return running;
    if (!dirty) return;
    running = drain().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    schedule(value) {
      latest = value;
      dirty = true;
      set("pending");
      clearTimer();
      timer = setTimeout(() => void flush(), delayMs);
    },
    flush,
    dispose: flush,
    status: () => current,
  };
}
