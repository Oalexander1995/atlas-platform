import React from 'react';
import { SimulatorClient } from './SimulatorClient';

export const metadata = {
  title: 'Investment Simulator — Atlas Micro-Investing',
  description: '1,000-run Monte Carlo investment simulator based on Section 6 risk tier assumptions.',
};

export default function SimulatorPage() {
  return (
    <div className="py-2">
      <SimulatorClient />
    </div>
  );
}
