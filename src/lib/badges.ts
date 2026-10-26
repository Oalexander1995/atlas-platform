import { query } from './db';
import { ClockService } from './clock';

export interface UserBadge {
  id: string;
  userId: string;
  badgeCode: string;
  title: string;
  description: string;
  awardedAt: string;
}

export const BADGE_DEFINITIONS = [
  {
    code: 'first_lesson',
    title: 'First Step',
    description: 'Completed your very first Atlas micro-investing lesson.',
    icon: '🌱',
  },
  {
    code: 'diversifier',
    title: 'Egg Basket Scholar',
    description: 'Learned why spreading micro-investments protects against sudden losses.',
    icon: '🧺',
  },
  {
    code: 'risk_ready',
    title: 'Risk Ready',
    description: 'Mastered the relationship between risk, reward, and capital at risk.',
    icon: '🧭',
  },
  {
    code: 'simulator_explorer',
    title: 'Simulator Explorer',
    description: 'Experimented with the 1,000-run Monte Carlo investment simulator.',
    icon: '🔬',
  },
  {
    code: 'safety_first',
    title: 'Safety First',
    description: 'Successfully completed the appropriateness knowledge check.',
    icon: '🛡️',
  },
  {
    code: 'bookworm',
    title: 'Atlas Scholar',
    description: 'Completed all 6 core learning modules in the Learning Hub!',
    icon: '🎓',
  },
];

export async function awardBadge(params: {
  userId: string;
  badgeCode: string;
  title?: string;
  description?: string;
}): Promise<boolean> {
  const { userId, badgeCode } = params;
  const def = BADGE_DEFINITIONS.find((b) => b.code === badgeCode);
  const title = params.title || def?.title || badgeCode;
  const description = params.description || def?.description || '';
  const now = await ClockService.now();

  const res = await query(
    `INSERT INTO user_badges (user_id, badge_code, title, description, awarded_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, badge_code) DO NOTHING
     RETURNING id`,
    [userId, badgeCode, title, description, now.toISOString()]
  );

  return res.rows.length > 0;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const res = await query<{
    id: string;
    user_id: string;
    badge_code: string;
    title: string;
    description: string;
    awarded_at: string;
  }>(
    `SELECT id, user_id, badge_code, title, description, awarded_at
     FROM user_badges
     WHERE user_id = $1
     ORDER BY awarded_at ASC`,
    [userId]
  );

  return res.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    badgeCode: r.badge_code,
    title: r.title,
    description: r.description,
    awardedAt: r.awarded_at,
  }));
}
