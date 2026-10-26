import React from 'react';
import { ComplianceClient } from './ComplianceClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Compliance Reviewer — Atlas AI Coach Logs',
  description: 'Review and audit AI Coach educational boundary compliance and vulnerability flags.',
};

export default function CompliancePage() {
  return (
    <div className="py-2">
      <ComplianceClient />
    </div>
  );
}
