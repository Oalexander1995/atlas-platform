# Atlas Double-Entry Ledger Specification

This document defines the double-entry bookkeeping rules, account structures, sign conventions, and reconciliation procedures in accordance with Section 8 of `Atlas_PRD.md`.

---

## 1. Core Principles

1. **Integer Arithmetic in Pence**: All monetary values are strictly represented as `BIGINT` amounts in British Pence (e.g. £10.00 = `1000` pence). Floating point numbers are strictly forbidden.
2. **Every Movement Balances to Zero**: Every financial transaction creates one `journal_entry` with two or more `postings`. The sum of `amount_pence` across all postings in any journal entry must equal zero:
   $$\sum \text{amount\_pence} = 0$$
   This is enforced by an immediate/deferred database constraint trigger.
3. **Append-Only Immutability**: `journal_entries` and `postings` cannot be updated or deleted. Corrections are made strictly via reversing journal entries.
4. **Derived Balances**: Account balances are never stored in mutable columns. Balances are computed directly from the ledger postings:
   ```sql
   SELECT SUM(amount_pence) FROM postings WHERE account_id = :account_id;
   ```
5. **No Negative Wallets**: User wallet balances can never drop below zero. Updates lock the account row (`SELECT ... FOR UPDATE`) and reject any operation reducing balance below zero with `INSUFFICIENT_FUNDS`.

---

## 2. Sign Convention & Account Purposes

Atlas uses a standardized directional sign convention where:
- **Positive (`+amount`)**: Money received / debited into the account.
- **Negative (`-amount`)**: Money sent / credited out of the account.

### Account Purposes (`ledger_accounts.purpose`)
- `user_wallet`: Available demo cash balance held by an individual investor (`owner_user_id` set). Balance is positive.
- `external_bank`: Counterparty clearing account representing external deposits and withdrawals.
- `opportunity_escrow`: Escrow account holding committed investment funds for an opportunity before loan disbursement (`opportunity_id` set).
- `opportunity_partner`: Liability/borrower account representing the loan principal disbursed to the vetted business partner.
- `provision_fund`: Atlas platform buffer fund held to absorb losses at Atlas's discretion.
- `platform_fees`: Atlas company revenue account for platform fees.
- `prize_vouchers`: Clearing account for non-cash prize draw voucher allocations.

---

## 3. Transaction Matrix

| Event | Source Account (`-amount`) | Destination Account (`+amount`) | Journal Type | Notes |
|---|---|---|---|---|
| **Deposit** (£100) | `external_bank` (-10,000p) | `user_wallet` (+10,000p) | `deposit` | Increases wallet balance |
| **Withdrawal** (£50) | `user_wallet` (-5,000p) | `external_bank` (+5,000p) | `withdrawal` | Decreases wallet balance |
| **Single Investment** (£25) | `user_wallet` (-2,500p) | `opportunity_escrow(A)` (+2,500p) | `investment` | Creates/updates `holdings` |
| **Auto-Invest Allocation** (£100 across 10 slices) | `user_wallet` (-10,000p) | `opportunity_escrow(i)` (+1,000p each) | `auto_invest` | Multi-legged posting pair |
| **Disbursement** (£10k raised, 3% fee, 1% PF) | `opportunity_escrow(A)` (-1,000,000p) | `opportunity_partner(A)` (+970,000p)<br>`platform_fees` (+20,000p)<br>`provision_fund` (+10,000p) | `disbursement` | Opportunity becomes `repaying` |
| **Repayment** (Capital + Interest) | `opportunity_partner(A)` (-(C+I)) | Each investor's `user_wallet` (+share pro-rata) | `repayment` | Distributed using largest-remainder method |
| **Default Recovery** | `opportunity_partner(A)` (-recovered) | Each investor's `user_wallet` (+share) | `default_writeoff` | Unrecovered principal recorded in `holding_losses` |
| **Provision Fund Payout** | `provision_fund` (-payout) | `user_wallet` (+payout) | `provision_payout` | Discretionary compensation |

---

## 4. Reconciliation Checks (Section 8.5)

Reconciliation runs periodically and as an automated test, verifying:
1. Every journal entry's postings sum exactly to 0.
2. For every opportunity:
   $$\text{Total Invested} - \text{Capital Repaid} - \text{Principal Written Off} = \sum \text{holdings.principal\_pence}$$
3. No `user_wallet` account balance is negative.
4. Provision Fund balance = Total Contributions - Total Payouts.
