'use client';

import React, { useState } from 'react';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import { Opportunity } from '@/lib/opportunities';

export function AdminOpportunitiesClient({
  initialOpportunities,
}: {
  initialOpportunities: Opportunity[];
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/v1/admin/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');

      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Manage Opportunities ({opportunities.length})</h2>
        <span className="text-xs text-slate-400">Admin Console</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-slate-500">
            <tr>
              <th className="p-4 font-semibold">Title & Partner</th>
              <th className="p-4 font-semibold">Risk Tier</th>
              <th className="p-4 font-semibold">Target</th>
              <th className="p-4 font-semibold">Raised</th>
              <th className="p-4 font-semibold">Term</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Change Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-slate-700">
            {opportunities.map((opp) => (
              <tr key={opp.id} className="hover:bg-stone-50 transition">
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{opp.title}</div>
                  <div className="text-xs text-slate-400">{opp.partner_name}</div>
                </td>
                <td className="p-4">
                  <RiskTierBadge tier={opp.risk_tier} size="sm" />
                </td>
                <td className="p-4 font-mono">£{(opp.target_pence / 100).toLocaleString('en-GB')}</td>
                <td className="p-4 font-mono">£{(opp.raised_pence / 100).toLocaleString('en-GB')}</td>
                <td className="p-4">{opp.term_months} mo</td>
                <td className="p-4">
                  <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-slate-800">
                    {opp.status}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    value={opp.status}
                    disabled={updatingId === opp.id}
                    onChange={(e) => handleStatusChange(opp.id, e.target.value)}
                    className="text-xs border border-stone-200 rounded-lg p-1.5 bg-stone-50 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="funded">Funded</option>
                    <option value="repaying">Repaying</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
