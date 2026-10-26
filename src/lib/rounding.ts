/**
 * Largest-Remainder Method Pro-Rata Distribution (Section 8.4)
 *
 * Distributes integer pence proportionally across recipients based on weights
 * (such as holding principal). Floored shares are calculated, and leftover pennies
 * are distributed one by one to recipients with the largest fractional remainders,
 * breaking ties by earliest tieBreaker (e.g., holding creation time or ID).
 *
 * Guarantees that the sum of allocated pence always strictly equals totalPence.
 */

export interface RecipientWeight {
  id: string;
  weight: number;
  tieBreaker?: string | number;
}

export function distributeProRataLargestRemainder<T extends RecipientWeight>(
  totalPence: number,
  recipients: T[]
): Map<string, number> {
  const result = new Map<string, number>();

  if (!Number.isInteger(totalPence) || totalPence < 0) {
    throw new Error('totalPence must be a non-negative integer');
  }

  if (recipients.length === 0 || totalPence === 0) {
    for (const r of recipients) {
      result.set(r.id, 0);
    }
    return result;
  }

  const totalWeight = recipients.reduce((sum, r) => sum + Math.max(0, r.weight), 0);

  if (totalWeight === 0) {
    for (const r of recipients) {
      result.set(r.id, 0);
    }
    return result;
  }

  // Calculate floored shares and fractional remainders
  interface Candidate {
    id: string;
    floored: number;
    fraction: number;
    tieBreaker: string | number;
  }

  const candidates: Candidate[] = recipients.map((r) => {
    const w = Math.max(0, r.weight);
    const exact = (totalPence * w) / totalWeight;
    const floored = Math.floor(exact);
    const fraction = exact - floored;
    return {
      id: r.id,
      floored,
      fraction,
      tieBreaker: r.tieBreaker ?? r.id,
    };
  });

  const sumFloored = candidates.reduce((sum, c) => sum + c.floored, 0);
  let leftover = totalPence - sumFloored;

  // Sort candidates by fractional remainder descending, breaking ties by tieBreaker ascending
  candidates.sort((a, b) => {
    if (Math.abs(b.fraction - a.fraction) > 1e-9) {
      return b.fraction - a.fraction;
    }
    if (a.tieBreaker < b.tieBreaker) return -1;
    if (a.tieBreaker > b.tieBreaker) return 1;
    return 0;
  });

  // Distribute leftover pennies
  for (const c of candidates) {
    let allocated = c.floored;
    if (leftover > 0) {
      allocated += 1;
      leftover -= 1;
    }
    result.set(c.id, allocated);
  }

  // Safety check: sum of allocated must equal totalPence
  let actualSum = 0;
  for (const val of result.values()) {
    actualSum += val;
  }
  if (actualSum !== totalPence) {
    throw new Error(
      `Largest-remainder distribution invariant violated: actual ${actualSum}p !== expected ${totalPence}p`
    );
  }

  return result;
}
