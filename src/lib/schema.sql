-- Atlas Schema: Foundations & Ledger (Milestone 1 & 2)

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
-- Holdings & Losses (Section 8.1 - needed for reconciliation 8.5)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  opportunity_id UUID NOT NULL,
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
  opportunity_id UUID NOT NULL,
  amount_pence BIGINT NOT NULL CHECK (amount_pence >= 0),
  provision_payout_pence BIGINT NOT NULL DEFAULT 0,
  payout_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
