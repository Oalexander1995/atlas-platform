import { query } from './db';
import { hashPassword, UserRole, AccountState } from './auth';
import { depositDemoMoney, getOrCreateUserWallet, getWalletBalancePence } from './ledger';
import { ClockService } from './clock';

export async function ensureDemoUsersSeeded(): Promise<void> {
  const defaultPassword = 'AtlasDemo!2026';
  const passwordHash = await hashPassword(defaultPassword);
  const now = await ClockService.now();

  const demoUsers: Array<{
    email: string;
    fullName: string;
    role: UserRole;
    accountState: AccountState;
    initialBalancePence?: number;
  }> = [
    {
      email: 'admin@atlas.demo',
      fullName: 'Atlas Admin',
      role: 'admin',
      accountState: 'verified',
    },
    {
      email: 'compliance@atlas.demo',
      fullName: 'Atlas Compliance Officer',
      role: 'compliance',
      accountState: 'verified',
    },
    {
      email: 'ready@atlas.demo',
      fullName: 'Ready Investor',
      role: 'investor',
      accountState: 'verified',
      initialBalancePence: 50000, // £500.00
    },
    {
      email: 'active@atlas.demo',
      fullName: 'Active Investor (Dani)',
      role: 'investor',
      accountState: 'verified',
      initialBalancePence: 12500, // £125.00
    },
  ];

  for (const user of demoUsers) {
    const res = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, date_of_birth, postcode, role, account_state, created_at)
       VALUES ($1, $2, $3, '1990-01-01', 'SW1A 1AA', $4, $5, $6)
       ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [user.email, passwordHash, user.fullName, user.role, user.accountState, now.toISOString()]
    );
    const userId = res.rows[0].id;

    // Ensure wallet exists
    await getOrCreateUserWallet(userId);

    // If initial balance is specified and wallet is empty, deposit it via ledger
    if (user.initialBalancePence && user.initialBalancePence > 0) {
      const currentBal = await getWalletBalancePence(userId);
      if (currentBal === 0) {
        await depositDemoMoney({
          userId,
          amountPence: user.initialBalancePence,
          idempotencyKey: `seed_deposit_${userId}`,
          description: 'Initial demo balance',
        });
      }
    }
  }
}
