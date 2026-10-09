// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosave, type SaveStatus } from "./autosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(results: boolean[] = []) {
  const saved: number[] = [];
  const statuses: SaveStatus[] = [];
  let release: (() => void) | null = null;
  let hold = false;
  const save = vi.fn(async (value: number) => {
    if (hold) await new Promise<void>((r) => (release = r));
    saved.push(value);
    return results.length ? results.shift()! : true;
  });
  const autosave = createAutosave(save, (s) => statuses.push(s), 1000);
  return {
    autosave,
    save,
    saved,
    statuses,
    holdNext: () => (hold = true),
    releaseHeld: () => {
      hold = false;
      release?.();
    },
  };
}

describe("createAutosave", () => {
  it("saves once, about a second after the last change, with the latest value", async () => {
    const { autosave, saved, statuses } = setup();
    autosave.schedule(1);
    await vi.advanceTimersByTimeAsync(600);
    autosave.schedule(2);
    await vi.advanceTimersByTimeAsync(600);
    autosave.schedule(3);
    expect(saved).toEqual([]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(saved).toEqual([3]);
    expect(statuses).toEqual(["pending", "saving", "saved"]);
  });

  it("runs one save at a time; a change made during a save is saved right after it", async () => {
    const t = setup();
    t.holdNext();
    t.autosave.schedule(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.save).toHaveBeenCalledTimes(1);
    t.autosave.schedule(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.save).toHaveBeenCalledTimes(1); // still waiting on the first
    t.releaseHeld();
    await vi.runAllTimersAsync();
    expect(t.saved).toEqual([1, 2]);
    expect(t.autosave.status()).toBe("saved");
  });

  it("a failure is visible and keeps the value; a retry saves it", async () => {
    const t = setup([false, true]);
    t.autosave.schedule(7);
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.autosave.status()).toBe("failed");
    expect(t.statuses.at(-1)).toBe("failed");
    await t.autosave.flush();
    expect(t.saved).toEqual([7, 7]);
    expect(t.autosave.status()).toBe("saved");
  });

  it("a thrown error counts as a failure", async () => {
    const statuses: SaveStatus[] = [];
    const autosave = createAutosave(async () => {
      throw new Error("offline");
    }, (s) => statuses.push(s));
    autosave.schedule(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(autosave.status()).toBe("failed");
  });

  it("a newer change after a failure is the one saved", async () => {
    const t = setup([false, true]);
    t.autosave.schedule(1);
    await vi.advanceTimersByTimeAsync(1000);
    t.autosave.schedule(2);
    expect(t.autosave.status()).toBe("pending");
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.saved).toEqual([1, 2]);
    expect(t.autosave.status()).toBe("saved");
  });

  it("flush saves a waiting change now (leaving the screen) and does nothing when nothing waits", async () => {
    const t = setup();
    await t.autosave.flush();
    expect(t.save).not.toHaveBeenCalled();
    t.autosave.schedule(5);
    await t.autosave.dispose();
    expect(t.saved).toEqual([5]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(t.saved).toEqual([5]);
  });
});
