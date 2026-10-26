import { query } from './db';

const CLOCK_SETTING_KEY = 'clock_offset_ms';

let cachedOffsetMs: number | null = null;

/**
 * Clock Service
 * Ensures all time checks across the entire platform go through simulated time,
 * allowing demo time-travel (e.g., fast-forwarding 24 hours for cooling-off or retests).
 */
export class ClockService {
  /**
   * Initializes or loads the current clock offset from the database.
   */
  static async getOffsetMs(): Promise<number> {
    if (cachedOffsetMs !== null) {
      return cachedOffsetMs;
    }

    try {
      const res = await query<{ value: { offsetMs: number } }>(
        'SELECT value FROM system_settings WHERE key = $1',
        [CLOCK_SETTING_KEY]
      );

      if (res.rows.length > 0 && typeof res.rows[0].value?.offsetMs === 'number') {
        cachedOffsetMs = res.rows[0].value.offsetMs;
      } else {
        cachedOffsetMs = 0;
      }
    } catch {
      // In case DB is not yet initialized or during tests
      cachedOffsetMs = 0;
    }

    return cachedOffsetMs;
  }

  /**
   * Returns simulated now as a Date object.
   */
  static async now(): Promise<Date> {
    const offset = await this.getOffsetMs();
    return new Date(Date.now() + offset);
  }

  /**
   * Synchronous now using the currently cached offset (falls back to Date.now()).
   */
  static nowSync(): Date {
    const offset = cachedOffsetMs ?? 0;
    return new Date(Date.now() + offset);
  }

  /**
   * Returns simulated now as an ISO 8601 string.
   */
  static async nowISO(): Promise<string> {
    const date = await this.now();
    return date.toISOString();
  }

  /**
   * Fast-forwards the clock by a specified duration in milliseconds.
   */
  static async fastForward(durationMs: number): Promise<Date> {
    const currentOffset = await this.getOffsetMs();
    const newOffset = currentOffset + durationMs;
    return this.setOffset(newOffset);
  }

  /**
   * Fast-forwards by hours.
   */
  static async fastForwardHours(hours: number): Promise<Date> {
    return this.fastForward(hours * 60 * 60 * 1000);
  }

  /**
   * Fast-forwards by days.
   */
  static async fastForwardDays(days: number): Promise<Date> {
    return this.fastForward(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Explicitly sets the clock offset in milliseconds and persists it.
   */
  static async setOffset(offsetMs: number): Promise<Date> {
    cachedOffsetMs = offsetMs;
    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [CLOCK_SETTING_KEY, JSON.stringify({ offsetMs })]
    );

    return new Date(Date.now() + offsetMs);
  }

  /**
   * Resets the clock to real system time.
   */
  static async reset(): Promise<Date> {
    return this.setOffset(0);
  }
}
