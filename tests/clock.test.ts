import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClockService } from '@/lib/clock';
import { getDb, closeDb } from '@/lib/db';

describe('Clock Service (Admin Fast-Forward Support)', () => {
  beforeAll(async () => {
    await getDb('memory://');
    await ClockService.reset();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('starts synchronized near system time', async () => {
    const clockTime = await ClockService.now();
    const sysTime = Date.now();
    expect(Math.abs(clockTime.getTime() - sysTime)).toBeLessThan(1000);
  });

  it('fast-forwards by specified hours and persists offset', async () => {
    const before = await ClockService.now();
    await ClockService.fastForwardHours(24);
    const after = await ClockService.now();

    const diffMs = after.getTime() - before.getTime();
    const expectedDiffMs = 24 * 60 * 60 * 1000;

    // Allow up to 1 second variance for test execution delay
    expect(Math.abs(diffMs - expectedDiffMs)).toBeLessThan(1000);
  });

  it('resets clock offset back to zero', async () => {
    await ClockService.reset();
    const offset = await ClockService.getOffsetMs();
    expect(offset).toBe(0);

    const clockTime = await ClockService.now();
    expect(Math.abs(clockTime.getTime() - Date.now())).toBeLessThan(1000);
  });
});
