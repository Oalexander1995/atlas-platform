import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { checkContent } = require('../scripts/lint-copy.cjs');

describe('Copy Lint Enforcement (PRD Section 0.1.6 & 14.3)', () => {
  it('detects prohibited terms in copy', () => {
    const badTexts = [
      'We offer guaranteed returns of 8% on all projects.',
      'This platform has a zero-failure philosophy.',
      'Invest today for a risk-free income.',
      'A safe investment with predictable returns.',
      'You cannot lose on this opportunity, it is safe returns.',
      'Enter our weekly lottery to win cash.',
    ];

    for (const text of badTexts) {
      const violations = checkContent(text, 'test-file.tsx');
      expect(violations.length).toBeGreaterThan(0);
    }
  });

  it('allows required negative disclaimers without triggering violations', () => {
    const compliantTexts = [
      'Expected return range 5–8% a year, not guaranteed.',
      'The Provision Fund is discretionary and is not a guarantee.',
      'All investments carry capital risk; returns are not guaranteed.',
    ];

    for (const text of compliantTexts) {
      const violations = checkContent(text, 'compliant-file.tsx');
      expect(violations.length).toBe(0);
    }
  });
});
