import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabase,
  resetDatabase,
} from '../../packages/database/src/factory';

const database = vi.hoisted(() => ({
  getSingleton: vi.fn(),
  resetSingletons: vi.fn(),
}));
vi.mock('../../packages/database/src/database', () => ({
  Database: database,
}));
vi.mock('../../packages/database/src/adapters/node', () => ({
  NodeStorageAdapter: class {},
}));

beforeEach(() => {
  vi.useFakeTimers();
  resetDatabase();
  database.getSingleton.mockReset();
});
afterEach(() => {
  resetDatabase();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('database initialization timeout cleanup', () => {
  it('cleans timers for the initializer and concurrent waiters', async () => {
    const instance = {};
    let finish: (value: object) => void = () => undefined;
    database.getSingleton.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const first = createDatabase({ environment: 'node' });
    const second = createDatabase({ environment: 'node' });
    await vi.advanceTimersByTimeAsync(0);
    finish(instance);
    expect(await first).toBe(instance);
    expect(await second).toBe(instance);
    expect(database.getSingleton).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans failed initialization timers and permits retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    database.getSingleton.mockRejectedValueOnce(new Error('Open failed'));
    await expect(createDatabase({ environment: 'node' })).rejects.toThrow(
      'Open failed'
    );
    expect(vi.getTimerCount()).toBe(0);
    const instance = {};
    database.getSingleton.mockResolvedValueOnce(instance);
    expect(await createDatabase({ environment: 'node' })).toBe(instance);
    expect(vi.getTimerCount()).toBe(0);
  });
});
