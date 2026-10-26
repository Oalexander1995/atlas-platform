import { describe, it, expect } from 'vitest';
import { distributeProRataLargestRemainder } from '../src/lib/rounding';

describe('distributeProRataLargestRemainder (Section 8.4)', () => {
  it('distributes exact multiples evenly without remainders', () => {
    const recipients = [
      { id: 'u1', weight: 100 },
      { id: 'u2', weight: 200 },
      { id: 'u3', weight: 300 },
    ];
    // Total weight = 600, distribute 6,000 pence (£60)
    const result = distributeProRataLargestRemainder(6000, recipients);

    expect(result.get('u1')).toBe(1000);
    expect(result.get('u2')).toBe(2000);
    expect(result.get('u3')).toBe(3000);
    expect(Array.from(result.values()).reduce((a, b) => a + b, 0)).toBe(6000);
  });

  it('correctly allocates single leftover pennies to highest fractional remainders', () => {
    // 100 pence split between 3 equal holders (each 33.333... pence)
    const recipients = [
      { id: 'u1', weight: 10, tieBreaker: '2026-01-01' },
      { id: 'u2', weight: 10, tieBreaker: '2026-01-02' },
      { id: 'u3', weight: 10, tieBreaker: '2026-01-03' },
    ];
    const result = distributeProRataLargestRemainder(100, recipients);

    // u1 gets 34p because of earliest tieBreaker, u2 and u3 get 33p each
    expect(result.get('u1')).toBe(34);
    expect(result.get('u2')).toBe(33);
    expect(result.get('u3')).toBe(33);
    expect(result.get('u1')! + result.get('u2')! + result.get('u3')!).toBe(100);
  });

  it('allocates 2 leftover pennies to the 2 highest remainders', () => {
    // Total 100p split with weights 1, 2, 2 -> total weight = 5
    // exact: u1: 20p, u2: 40p, u3: 40p
    const recipients = [
      { id: 'u1', weight: 1 },
      { id: 'u2', weight: 2 },
      { id: 'u3', weight: 2 },
    ];
    const result = distributeProRataLargestRemainder(100, recipients);

    expect(result.get('u1')).toBe(20);
    expect(result.get('u2')).toBe(40);
    expect(result.get('u3')).toBe(40);
  });

  it('handles zero totalPence cleanly', () => {
    const recipients = [
      { id: 'u1', weight: 50 },
      { id: 'u2', weight: 50 },
    ];
    const result = distributeProRataLargestRemainder(0, recipients);
    expect(result.get('u1')).toBe(0);
    expect(result.get('u2')).toBe(0);
  });

  it('handles single recipient getting 100% of allocation', () => {
    const recipients = [{ id: 'solo', weight: 2500 }];
    const result = distributeProRataLargestRemainder(12345, recipients);
    expect(result.get('solo')).toBe(12345);
  });

  it('guarantees sum strictly equals total pence for large prime splits', () => {
    // 97 pence across 7 different odd weights
    const recipients = [
      { id: 'r1', weight: 17, tieBreaker: '1' },
      { id: 'r2', weight: 23, tieBreaker: '2' },
      { id: 'r3', weight: 31, tieBreaker: '3' },
      { id: 'r4', weight: 47, tieBreaker: '4' },
      { id: 'r5', weight: 59, tieBreaker: '5' },
      { id: 'r6', weight: 71, tieBreaker: '6' },
      { id: 'r7', weight: 83, tieBreaker: '7' },
    ];
    const totalPence = 97;
    const result = distributeProRataLargestRemainder(totalPence, recipients);

    const sum = Array.from(result.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalPence);
  });
});
