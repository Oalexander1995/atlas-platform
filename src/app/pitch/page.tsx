import React from 'react';
import type { Metadata } from 'next';
import { PitchClient } from './PitchClient';

export const metadata: Metadata = {
  title: 'Pitch an Investment Opportunity — Atlas',
  description:
    'List your investment project or venture on Atlas to raise funding from micro-investors and share in the returns.',
};

export default function PitchPage() {
  return <PitchClient />;
}
