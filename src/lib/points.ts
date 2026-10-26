import { query, transaction } from './db';
import { ClockService } from './clock';
import { awardBadge } from './badges';

export type PointsReason =
  | 'complete_lesson'
  | 'pass_quiz_first_time'
  | 'use_simulator'
  | 'learning_streak'
  | 'complete_profile'
  | 'exchange_prize_draw_entry';

export const POINTS_AWARDS = {
  complete_lesson: 50,
  pass_quiz_first_time: 20,
  use_simulator: 10,
  learning_streak: 50,
  complete_profile: 25,
  exchange_prize_draw_entry: -100, // 100 points per entry
} as const;

/**
 * Returns total points balance for a user
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
  const res = await query<{ total_points: string }>(
    `SELECT COALESCE(SUM(points), 0) AS total_points
     FROM points_transactions
     WHERE user_id = $1`,
    [userId]
  );
  return Math.max(0, Number(res.rows[0]?.total_points || 0));
}

/**
 * Awards or deducts points according to strict non-investment allowlist (Section 5.15)
 */
export async function awardPoints(params: {
  userId: string;
  reason: PointsReason;
  points?: number;
  referenceId?: string;
}): Promise<{ newBalance: number; pointsAwarded: number }> {
  const { userId, reason, referenceId } = params;

  // Strict allowlist validation
  const allowedReasons: PointsReason[] = [
    'complete_lesson',
    'pass_quiz_first_time',
    'use_simulator',
    'learning_streak',
    'complete_profile',
    'exchange_prize_draw_entry',
  ];

  if (!allowedReasons.includes(reason)) {
    throw new Error(`Invalid points reason: ${reason}. Points can never be awarded for investment activity.`);
  }

  const points = params.points ?? POINTS_AWARDS[reason];
  const now = await ClockService.now();

  await query(
    `INSERT INTO points_transactions (user_id, points, reason, reference_id, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, points, reason, referenceId || null, now.toISOString()]
  );

  const newBalance = await getUserPointsBalance(userId);
  return { newBalance, pointsAwarded: points };
}

/**
 * Records lesson completion, awards points, and checks badges (Section 5.13 & 5.15)
 */
export async function recordLessonCompletion(params: {
  userId: string;
  lessonId: string;
  quizScore: number;
}): Promise<{
  pointsEarned: number;
  passedFirstTime: boolean;
  newBalance: number;
  newBadges: string[];
}> {
  const { userId, lessonId, quizScore } = params;

  // Check if previously completed
  const existing = await query<{ id: string }>(
    'SELECT id FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
    [userId, lessonId]
  );

  const isFirstAttempt = existing.rows.length === 0;
  const passedFirstTime = isFirstAttempt && quizScore === 3;
  const now = await ClockService.now();

  if (isFirstAttempt) {
    await query(
      `INSERT INTO lesson_progress (user_id, lesson_id, quiz_score, passed_first_time, completed_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, lessonId, quizScore, passedFirstTime, now.toISOString()]
    );
  } else {
    await query(
      `UPDATE lesson_progress
       SET quiz_score = GREATEST(quiz_score, $1), completed_at = $2
       WHERE user_id = $3 AND lesson_id = $4`,
      [quizScore, now.toISOString(), userId, lessonId]
    );
  }

  let totalPointsEarned = 0;
  const newBadges: string[] = [];

  // Award points only once per lesson
  if (isFirstAttempt) {
    const res1 = await awardPoints({
      userId,
      reason: 'complete_lesson',
      points: 50,
      referenceId: lessonId,
    });
    totalPointsEarned += 50;

    if (passedFirstTime) {
      await awardPoints({
        userId,
        reason: 'pass_quiz_first_time',
        points: 20,
        referenceId: lessonId,
      });
      totalPointsEarned += 20;
    }

    // Badge 1: First lesson
    const b1 = await awardBadge({
      userId,
      badgeCode: 'first_lesson',
      title: 'First Step',
      description: 'Completed your very first Atlas micro-investing lesson.',
    });
    if (b1) newBadges.push('first_lesson');

    // Badge 2: Diversifier (Why diversify lesson)
    if (lessonId === 'why-diversify') {
      const b2 = await awardBadge({
        userId,
        badgeCode: 'diversifier',
        title: 'Egg Basket Scholar',
        description: 'Learned why spreading micro-investments protects against sudden losses.',
      });
      if (b2) newBadges.push('diversifier');
    }

    // Badge 3: Risk Ready (Risk and reward lesson)
    if (lessonId === 'risk-and-reward') {
      const b3 = await awardBadge({
        userId,
        badgeCode: 'risk_ready',
        title: 'Risk Ready',
        description: 'Mastered the relationship between risk, reward, and capital at risk.',
      });
      if (b3) newBadges.push('risk_ready');
    }

    // Check if all 6 lessons completed
    const allCompleted = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM lesson_progress WHERE user_id = $1',
      [userId]
    );
    if (Number(allCompleted.rows[0]?.count || 0) >= 6) {
      const b4 = await awardBadge({
        userId,
        badgeCode: 'bookworm',
        title: 'Atlas Scholar',
        description: 'Completed all 6 core learning modules in the Learning Hub!',
      });
      if (b4) newBadges.push('bookworm');
    }
  }

  const newBalance = await getUserPointsBalance(userId);

  return {
    pointsEarned: totalPointsEarned,
    passedFirstTime,
    newBalance,
    newBadges,
  };
}

/**
 * Records simulator usage: 10 points max once per day (Section 5.15)
 */
export async function recordSimulatorUsage(userId: string): Promise<{
  pointsAwarded: number;
  newBalance: number;
  awarded: boolean;
}> {
  const now = await ClockService.now();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if points were already awarded today for simulator
  const existing = await query<{ id: string }>(
    `SELECT id FROM points_transactions
     WHERE user_id = $1 AND reason = 'use_simulator' AND created_at >= $2`,
    [userId, startOfDay.toISOString()]
  );

  if (existing.rows.length > 0) {
    const currentBalance = await getUserPointsBalance(userId);
    return { pointsAwarded: 0, newBalance: currentBalance, awarded: false };
  }

  const { newBalance, pointsAwarded } = await awardPoints({
    userId,
    reason: 'use_simulator',
    points: 10,
  });

  // Award Simulator Explorer badge
  await awardBadge({
    userId,
    badgeCode: 'simulator_explorer',
    title: 'Simulator Explorer',
    description: 'Experimented with the 1,000-run Monte Carlo investment simulator.',
  });

  return { pointsAwarded, newBalance, awarded: true };
}
