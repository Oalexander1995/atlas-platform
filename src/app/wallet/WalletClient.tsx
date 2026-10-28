'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import { OnboardingProgressCard, OnboardingStatusProps } from '@/components/OnboardingProgressCard';

interface WalletClientProps {
  initialBalancePence: number;
  initialTransactions: Array<{
    id: string;
    journalEntryId: string;
    idempotencyKey: string;
    type: string;
    description: string;
    amountPence: number;
    createdAt: string;
  }>;
  userEmail: string;
  onboardingStatus?: OnboardingStatusProps;
}

export function WalletClient({
  initialBalancePence,
  initialTransactions,
  userEmail,
  onboardingStatus,
}: WalletClientProps) {
  const [balancePence, setBalancePence] = useState(initialBalancePence);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [customAmount, setCustomAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presets = [50, 100, 500];

  const handleDeposit = async (amountPounds: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const pence = Math.round(amountPounds * 100);
      const res = await fetch('/api/v1/wallet/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `dep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        },
        body: JSON.stringify({ amount_pence: pence }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Deposit failed');
      }

      setBalancePence(data.data.balancePence);
      setMessage({ type: 'success', text: `Added £${amountPounds.toFixed(2)} of demo money.` });
      setCustomAmount('');

      // Refresh transactions
      const refreshRes = await fetch('/api/v1/wallet');
      const refreshData = await refreshRes.json();
      if (refreshData.data?.transactions) {
        setTransactions(refreshData.data.transactions);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Deposit error' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setLoading(true);
    setMessage(null);
    try {
      const pence = Math.round(amountNum * 100);
      const res = await fetch('/api/v1/wallet/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `with_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        },
        body: JSON.stringify({ amount_pence: pence }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Withdrawal failed');
      }

      setBalancePence(data.data.balancePence);
      setMessage({ type: 'success', text: `Withdrew £${amountNum.toFixed(2)} to simulated bank.` });
      setWithdrawAmount('');

      // Refresh transactions
      const refreshRes = await fetch('/api/v1/wallet');
      const refreshData = await refreshRes.json();
      if (refreshData.data?.transactions) {
        setTransactions(refreshData.data.transactions);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Withdrawal error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Demo Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulated — no real bank connection. Balances are derived directly from the double-entry ledger.
        </p>
      </div>

      {onboardingStatus && <OnboardingProgressCard status={onboardingStatus} />}

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Available Demo Balance</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-900">
            £{(balancePence / 100).toFixed(2)}
          </div>
          <p className="text-xs text-slate-400">Max allowed demo balance: £5,000.00</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Currently Invested</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-600">£0.00</div>
          <p className="text-xs text-slate-400">Holds active opportunities (Milestone 5)</p>
        </div>
      </div>

      {/* Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Panel */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            <h3>Add Demo Money</h3>
          </div>
          <p className="text-xs text-slate-500">
            Choose a quick preset or type a custom amount to add simulated funds.
          </p>

          <div className="flex gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                disabled={loading}
                onClick={() => handleDeposit(preset)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-sm font-semibold text-slate-800 transition disabled:opacity-50"
              >
                +£{preset}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseFloat(customAmount);
              if (!isNaN(val) && val > 0) handleDeposit(val);
            }}
            className="flex gap-2 pt-2"
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">£</span>
              <input
                type="number"
                min="1"
                step="1"
                max="5000"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customAmount}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>

        {/* Withdraw Panel */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ArrowUpRight className="w-5 h-5 text-amber-600" />
            <h3>Withdraw to Simulated Bank</h3>
          </div>
          <p className="text-xs text-slate-500">
            Moves simulated money from your wallet back to the demo bank account.
          </p>

          <form onSubmit={handleWithdraw} className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">£</span>
              <input
                type="number"
                min="1"
                step="1"
                max={(balancePence / 100).toString()}
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-amber-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !withdrawAmount || balancePence <= 0}
              className="w-full py-2 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 transition disabled:opacity-50"
            >
              Withdraw
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History (Section 5.5) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Transaction History</h3>
          <span className="text-xs text-slate-400">{transactions.length} total postings</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No wallet transactions yet. Add demo money above to see ledger postings.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {transactions.map((tx) => {
              const isPositive = tx.amountPence > 0;
              return (
                <div key={tx.id} className="p-4 hover:bg-stone-50 transition flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          tx.type === 'deposit'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{tx.description}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Journal ID: {tx.journalEntryId.slice(0, 8)}... | {new Date(tx.createdAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      isPositive ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isPositive ? '+' : '-'}£{(Math.abs(tx.amountPence) / 100).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
