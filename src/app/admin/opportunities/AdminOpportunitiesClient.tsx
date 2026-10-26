'use client';

import React, { useState } from 'react';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import { Opportunity } from '@/lib/opportunities';
import {
  Coins,
  Send,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  Sliders,
} from 'lucide-react';

export function AdminOpportunitiesClient({
  initialOpportunities,
}: {
  initialOpportunities: Opportunity[];
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [activeModal, setActiveModal] = useState<
    'disburse' | 'repayment' | 'default' | 'reconciliation' | null
  >(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Repayment form
  const [repayCapital, setRepayCapital] = useState<string>('1000'); // in pounds
  const [repayInterest, setRepayInterest] = useState<string>('50'); // in pounds

  // Default form
  const [recoveryPct, setRecoveryPct] = useState<number>(40);
  const [provisionPayoutPct, setProvisionPayoutPct] = useState<number>(100);
  const [payoutReason, setPayoutReason] = useState<string>(
    'Discretionary coverage for borrower unforeseen operational failure'
  );

  // Reconciliation report state
  const [reconReport, setReconReport] = useState<any>(null);

  const openModal = (
    opp: Opportunity | null,
    modalType: 'disburse' | 'repayment' | 'default' | 'reconciliation'
  ) => {
    setSelectedOpp(opp);
    setActiveModal(modalType);
    setActionMessage(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOpp(null);
    setActionMessage(null);
  };

  // Disburse Handler
  const handleDisburse = async () => {
    if (!selectedOpp) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/opportunities/${selectedOpp.id}/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `disburse_${selectedOpp.id}_${Date.now()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Disbursement failed');

      setActionMessage({
        type: 'success',
        text: `Successfully disbursed £${(data.data.totalRaisedPence / 100).toFixed(
          2
        )} to partner (Net: £${(data.data.netPartnerPence / 100).toFixed(
          2
        )}, Fee: £${(data.data.platformFeePence / 100).toFixed(2)}, PF: £${(
          data.data.provisionContributionPence / 100
        ).toFixed(2)}). Status updated to 'repaying'.`,
      });

      setOpportunities((prev) =>
        prev.map((o) => (o.id === selectedOpp.id ? { ...o, status: 'repaying' as any } : o))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Repayment Handler
  const handleRepayment = async () => {
    if (!selectedOpp) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const capPence = Math.round(parseFloat(repayCapital || '0') * 100);
      const intPence = Math.round(parseFloat(repayInterest || '0') * 100);

      const res = await fetch(`/api/v1/admin/opportunities/${selectedOpp.id}/repayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `repay_${selectedOpp.id}_${Date.now()}`,
        },
        body: JSON.stringify({
          capital_pence: capPence,
          interest_pence: intPence,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Repayment failed');

      setActionMessage({
        type: 'success',
        text: `Repayment of £${(data.data.totalPence / 100).toFixed(
          2
        )} processed across ${data.data.recipientsCount} investor(s) using largest-remainder pro-rata method! In-app notifications sent.`,
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Default Handler
  const handleDefault = async () => {
    if (!selectedOpp) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/opportunities/${selectedOpp.id}/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `default_${selectedOpp.id}_${Date.now()}`,
        },
        body: JSON.stringify({
          recovery_percent: recoveryPct,
          provision_payout_percent: selectedOpp.risk_tier === 'uncharted' ? 0 : provisionPayoutPct,
          payout_reason: payoutReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Default processing failed');

      setActionMessage({
        type: 'success',
        text: `Default processed: ${data.data.affectedHoldersCount} investor(s) affected. Total recovered: £${(
          data.data.totalRecoveredPence / 100
        ).toFixed(2)}, Provision Fund payout: £${(
          data.data.totalProvisionPayoutPence / 100
        ).toFixed(2)}. In-app notices dispatched.`,
      });

      setOpportunities((prev) =>
        prev.map((o) => (o.id === selectedOpp.id ? { ...o, status: 'defaulted' as any } : o))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Reconciliation Handler
  const handleRunRecon = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/admin/reconciliation');
      const data = await res.json();
      setReconReport(data.data);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-700" />
          <span className="font-bold text-slate-900 text-sm">
            Platform Lifecycle Event Controls
          </span>
        </div>

        <button
          onClick={() => {
            openModal(null, 'reconciliation');
            handleRunRecon();
          }}
          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-200"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Run Ledger Reconciliation (Section 8.5)</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Opportunities ({opportunities.length})
          </h2>
          <span className="text-xs text-slate-400">Milestone 7 Event Simulation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Title & Partner</th>
                <th className="p-4 font-semibold">Risk Tier</th>
                <th className="p-4 font-semibold">Raised / Target</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-700">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-stone-50/70 transition">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{opp.title}</div>
                    <div className="text-[11px] text-slate-400">{opp.partner_name}</div>
                  </td>
                  <td className="p-4">
                    <RiskTierBadge tier={opp.risk_tier} size="sm" />
                  </td>
                  <td className="p-4 font-mono">
                    £{(opp.raised_pence / 100).toLocaleString('en-GB')} / £
                    {(opp.target_pence / 100).toLocaleString('en-GB')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`capitalize px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        opp.status === 'repaying'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : opp.status === 'defaulted'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : opp.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-slate-800'
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Disburse Action */}
                      {(opp.status === 'open' || opp.status === 'funded') &&
                        opp.raised_pence > 0 && (
                          <button
                            onClick={() => openModal(opp, 'disburse')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition text-[11px] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Disburse</span>
                          </button>
                        )}

                      {/* Repayment Action */}
                      {opp.status === 'repaying' && (
                        <button
                          onClick={() => openModal(opp, 'repayment')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold border border-blue-200 transition text-[11px] flex items-center gap-1"
                        >
                          <Coins className="w-3 h-3" />
                          <span>Repay</span>
                        </button>
                      )}

                      {/* Default Action */}
                      {(opp.status === 'repaying' || opp.status === 'open') && (
                        <button
                          onClick={() => openModal(opp, 'default')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold border border-rose-200 transition text-[11px] flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Default</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Disburse */}
      {activeModal === 'disburse' && selectedOpp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Disburse Opportunity</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Disbursing <strong>{selectedOpp.title}</strong> will release the escrow funds to
                the borrower partner and transition the loan to <strong>repaying</strong>.
              </p>

              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                <div className="flex justify-between">
                  <span>Total Raised in Escrow:</span>
                  <span className="font-bold text-slate-900">
                    £{(selectedOpp.raised_pence / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform Fee (2%):</span>
                  <span>-£{((selectedOpp.raised_pence * 0.02) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Provision Fund (1%):</span>
                  <span>-£{((selectedOpp.raised_pence * 0.01) / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-1 flex justify-between font-bold text-slate-900">
                  <span>Net to Partner:</span>
                  <span>£{((selectedOpp.raised_pence * 0.97) / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburse}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Disbursing...' : 'Confirm Disbursement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Repayment */}
      {activeModal === 'repayment' && selectedOpp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Post Loan Repayment</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Post capital and interest repayment for <strong>{selectedOpp.title}</strong>. Slices
              will be distributed pro-rata to investors down to the penny via largest-remainder
              rounding.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Capital Repayment (£)
                </label>
                <input
                  type="number"
                  step="1"
                  value={repayCapital}
                  onChange={(e) => setRepayCapital(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Interest Repayment (£)
                </label>
                <input
                  type="number"
                  step="1"
                  value={repayInterest}
                  onChange={(e) => setRepayInterest(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRepayment}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Post Repayment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Default */}
      {activeModal === 'default' && selectedOpp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <h3 className="font-bold text-slate-900 text-sm">Simulate Loan Default</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Mark <strong>{selectedOpp.title}</strong> as defaulted. Configure recovered assets and
              discretionary Provision Fund payout.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Recovery Percentage: <strong>{recoveryPct}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={recoveryPct}
                  onChange={(e) => setRecoveryPct(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>

              {selectedOpp.risk_tier === 'uncharted' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  Uncharted risk tier holdings are strictly excluded from Provision Fund coverage per
                  Section 5.12.
                </div>
              ) : (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Provision Fund Payout on Remaining Loss:{' '}
                    <strong>{provisionPayoutPct}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={provisionPayoutPct}
                    onChange={(e) => setProvisionPayoutPct(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Discretionary Payout Reason
                </label>
                <textarea
                  rows={2}
                  value={payoutReason}
                  onChange={(e) => setPayoutReason(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDefault}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Default'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Reconciliation Report */}
      {activeModal === 'reconciliation' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Double-Entry Ledger Reconciliation (Section 8.5)
                </h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Running reconciliation checks across all ledger accounts...
              </div>
            ) : reconReport ? (
              <div className="space-y-4 text-xs">
                <div
                  className={`p-3 rounded-2xl flex items-center justify-between font-bold ${
                    reconReport.passed
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <span>Reconciliation Status:</span>
                  <span>{reconReport.passed ? 'PASSED ✓' : 'FAILED ✗'}</span>
                </div>

                <div className="space-y-2">
                  {reconReport.checks?.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5"
                    >
                      {c.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{c.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
