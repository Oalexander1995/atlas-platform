import React from 'react';
import { RewardsClient } from './RewardsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rewards, Badges & Prize Draw — Atlas Micro-Investing',
  description: 'Earn points and badges through learning, and enter our monthly voucher prize draw.',
};

export default function RewardsPage() {
  return (
    <div className="py-2">
      <RewardsClient />
    </div>
  );
}
