import { query, transaction } from './db';
import { ClockService } from './clock';
import { awardPoints, getUserPointsBalance } from './points';

export interface PrizeDrawRecord {
  id: string;
  month: string;
  seed: string | null;
  prizes: PrizeDefinition[];
  status: 'open' | 'completed';
  runAt: string | null;
  createdAt: string;
}

export interface PrizeDefinition {
  title: string;
  valuePounds: number;
  count: number;
}

export interface PrizeEntryRecord {
  id: string;
  drawId: string;
  userId: string | null;
  postalName: string | null;
  postalTown: string | null;
  source: 'points' | 'postal';
  createdAt: string;
}

export interface PrizeWinnerRecord {
  id: string;
  drawId: string;
  prizeTitle: string;
  voucherCode: string;
  displayName: string;
  displayTown: string;
  createdAt: string;
}

export const DEFAULT_PRIZES: PrizeDefinition[] = [
  { title: '£50 High Street Eco-Voucher', valuePounds: 50, count: 1 },
  { title: '£25 Local Bookshop Voucher', valuePounds: 25, count: 2 },
  { title: '£10 Community Cafe Voucher', valuePounds: 10, count: 5 },
];

/**
 * Seeded deterministic PRNG (Mulberry32 derived)
 * Guarantees 100% reproducible draws from seed string (Section 14.1)
 */
export function createSeededPrng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Formats a full name to "First Name + Initial" (Section 5.15)
 * e.g. "Alex Morgan" -> "Alex M."
 */
export function formatWinnerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

/**
 * Gets or creates the current active monthly prize draw
 */
export async function getOrCreateCurrentDraw(): Promise<PrizeDrawRecord> {
  const now = await ClockService.now();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const existing = await query<any>(
    'SELECT * FROM prize_draws WHERE month = $1',
    [month]
  );
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    return {
      id: row.id,
      month: row.month,
      seed: row.seed,
      prizes: row.prizes,
      status: row.status,
      runAt: row.run_at,
      createdAt: row.created_at,
    };
  }

  const res = await query<any>(
    `INSERT INTO prize_draws (month, prizes, status, created_at)
     VALUES ($1, $2, 'open', $3)
     RETURNING *`,
    [month, JSON.stringify(DEFAULT_PRIZES), now.toISOString()]
  );
  const row = res.rows[0];
  return {
    id: row.id,
    month: row.month,
    seed: row.seed,
    prizes: row.prizes,
    status: row.status,
    runAt: row.run_at,
    createdAt: row.created_at,
  };
}

/**
 * Exchanges points for prize draw entries: 100 points = 1 entry, max 10 per month (Section 5.15)
 */
export async function enterPrizeDrawWithPoints(params: {
  userId: string;
  entriesCount: number;
}): Promise<{ entriesAdded: number; remainingPoints: number }> {
  const { userId, entriesCount } = params;

  if (!Number.isInteger(entriesCount) || entriesCount <= 0) {
    throw new Error('Number of entries must be a positive integer');
  }

  const currentDraw = await getOrCreateCurrentDraw();
  if (currentDraw.status !== 'open') {
    throw new Error('Current monthly prize draw is closed');
  }

  // Check user monthly entry cap (max 10 entries per user per month)
  const userEntriesRes = await query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM prize_entries
     WHERE draw_id = $1 AND user_id = $2`,
    [currentDraw.id, userId]
  );
  const currentEntries = Number(userEntriesRes.rows[0]?.count || 0);

  if (currentEntries + entriesCount > 10) {
    throw new Error(
      `Maximum 10 entries per user per month. You currently have ${currentEntries} entries and attempted to add ${entriesCount}.`
    );
  }

  const requiredPoints = entriesCount * 100;
  const currentBalance = await getUserPointsBalance(userId);

  if (currentBalance < requiredPoints) {
    throw new Error(
      `Insufficient points. Required: ${requiredPoints} points (100 per entry), available: ${currentBalance} points.`
    );
  }

  // Deduct points
  await awardPoints({
    userId,
    reason: 'exchange_prize_draw_entry',
    points: -requiredPoints,
    referenceId: currentDraw.id,
  });

  const now = await ClockService.now();

  // Insert entries
  for (let i = 0; i < entriesCount; i++) {
    await query(
      `INSERT INTO prize_entries (draw_id, user_id, source, created_at)
       VALUES ($1, $2, 'points', $3)`,
      [currentDraw.id, userId, now.toISOString()]
    );
  }

  const remainingPoints = await getUserPointsBalance(userId);

  return {
    entriesAdded: entriesCount,
    remainingPoints,
  };
}

/**
 * Admin registers a free postal entry (Section 3.6 & 5.15)
 */
export async function addPostalEntry(params: {
  drawId?: string;
  name: string;
  town: string;
}): Promise<PrizeEntryRecord> {
  const { name, town } = params;
  if (!name.trim() || !town.trim()) {
    throw new Error('Postal name and town are required for free postal entries');
  }

  const draw = params.drawId
    ? (await query<any>('SELECT * FROM prize_draws WHERE id = $1', [params.drawId])).rows[0]
    : await getOrCreateCurrentDraw();

  if (!draw || draw.status !== 'open') {
    throw new Error('Draw is not open for postal entries');
  }

  const now = await ClockService.now();
  const res = await query<any>(
    `INSERT INTO prize_entries (draw_id, postal_name, postal_town, source, created_at)
     VALUES ($1, $2, $3, 'postal', $4)
     RETURNING *`,
    [draw.id, name.trim(), town.trim(), now.toISOString()]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    drawId: row.draw_id,
    userId: row.user_id,
    postalName: row.postal_name,
    postalTown: row.postal_town,
    source: row.source,
    createdAt: row.created_at,
  };
}

/**
 * Runs the monthly prize draw deterministically using a seed string (Section 5.15 & 14.1)
 */
export async function runPrizeDraw(
  drawId: string,
  explicitSeed?: string
): Promise<{
  drawId: string;
  seed: string;
  totalEntries: number;
  winners: {
    prizeTitle: string;
    voucherCode: string;
    displayName: string;
    displayTown: string;
  }[];
}> {
  return transaction(async (tx) => {
    // 1. Fetch draw
    const drawRes = await tx.query<{ id: string; status: string; prizes: any }>(
      'SELECT id, status, prizes FROM prize_draws WHERE id = $1 FOR UPDATE',
      [drawId]
    );
    if (drawRes.rows.length === 0) {
      throw new Error('Prize draw not found');
    }
    const draw = drawRes.rows[0];

    // 2. Fetch all entries joined with user details
    const entriesRes = await tx.query<{
      id: string;
      user_id: string | null;
      postal_name: string | null;
      postal_town: string | null;
      source: string;
      full_name: string | null;
      postcode: string | null;
      created_at: string;
    }>(
      `SELECT e.id, e.user_id, e.postal_name, e.postal_town, e.source, e.created_at,
              u.full_name, u.postcode
       FROM prize_entries e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.draw_id = $1
       ORDER BY e.created_at ASC, e.id ASC`,
      [drawId]
    );

    const entries = entriesRes.rows;
    if (entries.length === 0) {
      throw new Error('Cannot run prize draw with zero entries');
    }

    // 3. Establish deterministic seed
    const now = await ClockService.now();
    const seed = explicitSeed || `atlas_draw_${drawId}_${now.getTime()}_${Math.random()}`;
    const prng = createSeededPrng(seed);

    // 4. Flatten prizes list
    const prizes: PrizeDefinition[] = draw.prizes || DEFAULT_PRIZES;
    const flatPrizeList: string[] = [];
    for (const p of prizes) {
      for (let i = 0; i < p.count; i++) {
        flatPrizeList.push(p.title);
      }
    }

    // 5. Select winners without replacement using deterministic PRNG
    const remainingEntries = [...entries];
    const winners: {
      prizeTitle: string;
      voucherCode: string;
      displayName: string;
      displayTown: string;
    }[] = [];

    for (const prizeTitle of flatPrizeList) {
      if (remainingEntries.length === 0) break;

      const randIndex = Math.floor(prng() * remainingEntries.length);
      const chosenEntry = remainingEntries.splice(randIndex, 1)[0];

      // Format winner display name & town
      let displayName = 'Participant';
      let displayTown = 'UK';

      if (chosenEntry.source === 'postal' && chosenEntry.postal_name) {
        displayName = formatWinnerName(chosenEntry.postal_name);
        displayTown = chosenEntry.postal_town || 'UK';
      } else if (chosenEntry.full_name) {
        displayName = formatWinnerName(chosenEntry.full_name);
        displayTown = chosenEntry.postcode ? chosenEntry.postcode.split(' ')[0] : 'UK';
      }

      // Generate voucher code (demo vouchers, never wallet credit per Section 5.15)
      const voucherCode = `ATLAS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

      // Insert winner record
      await tx.query(
        `INSERT INTO prize_winners (draw_id, entry_id, prize_title, voucher_code, display_name, display_town, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          drawId,
          chosenEntry.id,
          prizeTitle,
          voucherCode,
          displayName,
          displayTown,
          now.toISOString(),
        ]
      );

      winners.push({
        prizeTitle,
        voucherCode,
        displayName,
        displayTown,
      });
    }

    // 6. Update draw status and store seed
    await tx.query(
      `UPDATE prize_draws
       SET status = 'completed', seed = $1, run_at = $2
       WHERE id = $3`,
      [seed, now.toISOString(), drawId]
    );

    return {
      drawId,
      seed,
      totalEntries: entries.length,
      winners,
    };
  });
}

/**
 * Fetches recent completed draws with anonymised winners for the public winners board
 */
export async function getPrizeDrawHistory(): Promise<
  {
    month: string;
    seed: string;
    runAt: string;
    winners: { prizeTitle: string; displayName: string; displayTown: string }[];
  }[]
> {
  const drawsRes = await query<{
    id: string;
    month: string;
    seed: string;
    run_at: string;
  }>(
    `SELECT id, month, seed, run_at
     FROM prize_draws
     WHERE status = 'completed'
     ORDER BY run_at DESC
     LIMIT 6`
  );

  const results = [];
  for (const d of drawsRes.rows) {
    const winnersRes = await query<{
      prize_title: string;
      display_name: string;
      display_town: string;
    }>(
      `SELECT prize_title, display_name, display_town
       FROM prize_winners
       WHERE draw_id = $1
       ORDER BY created_at ASC`,
      [d.id]
    );

    results.push({
      month: d.month,
      seed: d.seed,
      runAt: d.run_at,
      winners: winnersRes.rows.map((w) => ({
        prizeTitle: w.prize_title,
        displayName: w.display_name,
        displayTown: w.display_town,
      })),
    });
  }

  return results;
}
