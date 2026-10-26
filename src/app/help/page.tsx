import React from 'react';
import type { Metadata } from 'next';
import { HelpClient } from './HelpClient';

export const metadata: Metadata = {
  title: 'Help & FAQ — Atlas Micro-Investing',
  description:
    'Frequently asked questions about Atlas, FSCS protection, fees, cooling-off, and complaints.',
};

export default function HelpPage() {
  return <HelpClient />;
}
