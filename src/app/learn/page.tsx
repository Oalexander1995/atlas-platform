import React from 'react';
import { LearnHubClient } from './LearnHubClient';

export const metadata = {
  title: 'Learning Hub — Atlas Micro-Investing',
  description: 'Simple 3-minute lessons and quizzes to understand micro-investing, diversification, and safety.',
};

export default function LearnPage() {
  return (
    <div className="py-2">
      <LearnHubClient />
    </div>
  );
}
