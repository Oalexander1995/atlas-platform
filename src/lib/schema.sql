-- Atlas Schema: Foundations, Ledger, Opportunities, Onboarding, Auto-Invest (Milestones 1-6)

-- System Settings & Clock Offset
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users & Onboarding
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  postcode TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'admin', 'compliance')),
  account_state TEXT NOT NULL CHECK (account_state IN ('pending_kyc', 'verified', 'restricted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log (Append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before JSONB,
  after JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Append-only enforcement for audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON audit_log;
CREATE TRIGGER trg_audit_log_append_only
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- -------------------------------------------------------------
-- Double-Entry Ledger Tables (Section 8)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'income', 'expense', 'equity')),
  owner_user_id UUID REFERENCES users(id),
  opportunity_id UUID,
  purpose TEXT NOT NULL CHECK (purpose IN (
    'user_wallet', 'opportunity_escrow', 'opportunity_partner',
    'provision_fund', 'platform_fees', 'external_bank', 'prize_vouchers'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'deposit', 'withdrawal', 'investment', 'auto_invest',
    'disbursement', 'repayment', 'default_writeoff',
    'provision_contribution', 'provision_payout', 'fee'
  )),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  amount_pence BIGINT NOT NULL CHECK (amount_pence <> 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Append-only enforcement on journal_entries & postings
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries and postings are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_entries_append_only ON journal_entries;
CREATE TRIGGER trg_journal_entries_append_only
BEFORE UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS trg_postings_append_only ON postings;
CREATE TRIGGER trg_postings_append_only
BEFORE UPDATE OR DELETE ON postings
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

-- Deferred constraint trigger to ensure balanced journal entry
CREATE OR REPLACE FUNCTION check_journal_entry_balanced()
RETURNS TRIGGER AS $$
DECLARE
  v_sum BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount_pence), 0)
  INTO v_sum
  FROM postings
  WHERE journal_entry_id = NEW.journal_entry_id;

  IF v_sum <> 0 THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: net sum is % pence', NEW.journal_entry_id, v_sum;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_journal_entry_balanced ON postings;
CREATE CONSTRAINT TRIGGER trg_check_journal_entry_balanced
AFTER INSERT ON postings
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_journal_entry_balanced();

-- Balance view (derived dynamically from postings)
CREATE OR REPLACE VIEW account_balances AS
SELECT
  a.id AS account_id,
  a.code,
  a.purpose,
  a.owner_user_id,
  a.opportunity_id,
  COALESCE(SUM(p.amount_pence), 0) AS balance_pence
FROM ledger_accounts a
LEFT JOIN postings p ON a.id = p.account_id
GROUP BY a.id, a.code, a.purpose, a.owner_user_id, a.opportunity_id;

-- -------------------------------------------------------------
-- Partners & Opportunities (Section 8.1 & Section 5.6/5.7)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  founded_year INT NOT NULL,
  sector TEXT NOT NULL,
  location TEXT NOT NULL,
  track_record JSONB NOT NULL DEFAULT '{"repaid_on_time": 0, "previous_loans": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('low', 'medium', 'high', 'uncharted')),
  sector TEXT NOT NULL,
  target_pence BIGINT NOT NULL CHECK (target_pence > 0),
  raised_pence BIGINT NOT NULL DEFAULT 0 CHECK (raised_pence >= 0),
  expected_return_min_bps INT NOT NULL,
  expected_return_max_bps INT NOT NULL,
  term_months INT NOT NULL CHECK (term_months > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'funded', 'repaying', 'completed', 'defaulted')),
  platform_fee_bps INT NOT NULL DEFAULT 300,
  provision_contribution_bps INT NOT NULL DEFAULT 100,
  per_user_cap_pence BIGINT NOT NULL DEFAULT 100000,
  key_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  vetting_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  opens_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repayment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  capital_pence BIGINT NOT NULL CHECK (capital_pence >= 0),
  interest_pence BIGINT NOT NULL CHECK (interest_pence >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'defaulted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Investor Onboarding & Regulatory Guardrails (Section 3 & 5.3)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS investor_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('restricted', 'high_net_worth', 'sophisticated')),
  declaration_text TEXT NOT NULL,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appropriateness_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  question_ids INT[] NOT NULL,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_attempt_allowed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cooling_off (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMPTZ NOT NULL
);

-- -------------------------------------------------------------
-- Holdings & Losses (Section 8.1)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  principal_pence BIGINT NOT NULL CHECK (principal_pence >= 0),
  source TEXT NOT NULL CHECK (source IN ('manual', 'auto_invest')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, opportunity_id, source)
);

CREATE TABLE IF NOT EXISTS holding_losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID REFERENCES holdings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  amount_pence BIGINT NOT NULL CHECK (amount_pence >= 0),
  provision_payout_pence BIGINT NOT NULL DEFAULT 0,
  payout_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Auto-Invest Plans (Section 5.9)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auto_invest_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('low', 'medium', 'high')),
  monthly_pence BIGINT NOT NULL CHECK (monthly_pence >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Notifications (Section 8.1)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Learning Progress & Atlas Points (Section 5.13 & 5.15)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL,
  quiz_score INT NOT NULL,
  passed_first_time BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  points INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'complete_lesson', 'pass_quiz_first_time', 'use_simulator',
    'learning_streak', 'complete_profile', 'exchange_prize_draw_entry'
  )),
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Badges (Section 5.16)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  badge_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_code)
);

-- -------------------------------------------------------------
-- Prize Draws & Entries (Section 5.15)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prize_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT UNIQUE NOT NULL,
  seed TEXT,
  prizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prize_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES prize_draws(id),
  user_id UUID REFERENCES users(id),
  postal_name TEXT,
  postal_town TEXT,
  source TEXT NOT NULL CHECK (source IN ('points', 'postal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prize_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES prize_draws(id),
  entry_id UUID NOT NULL REFERENCES prize_entries(id),
  prize_title TEXT NOT NULL,
  voucher_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_town TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- AI Coach Conversations & Messages (Section 8.1 & 10)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);



