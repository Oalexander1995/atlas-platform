import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  QUESTION_BANK,
  getRandomAppropriatenessQuestions,
  submitSimulatedKyc,
  submitInvestorClassification,
  submitAppropriatenessTest,
  getOnboardingStatus,
} from '@/lib/onboarding';
import { registerUser } from '@/lib/auth';
import { ClockService } from '@/lib/clock';
import { getDb, closeDb } from '@/lib/db';

describe('Investor Onboarding & Regulatory Guardrails (Milestone 4)', () => {
  let testUserId: string;

  beforeAll(async () => {
    await getDb('memory://');
    await ClockService.reset();

    const user = await registerUser({
      email: 'onboarding_tester@atlas.demo',
      password: 'StrongOnboardingPass123!',
      fullName: 'Alex Morgan',
      dateOfBirth: '1996-08-12',
      postcode: 'BS1 5AH',
    });
    testUserId = user.userId;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('validates the question bank has 15 seeded questions across all 5 mandatory categories', () => {
    expect(QUESTION_BANK.length).toBe(15);

    const categories = new Set(QUESTION_BANK.map((q) => q.category));
    expect(categories.has('capital_at_risk')).toBe(true);
    expect(categories.has('illiquidity')).toBe(true);
    expect(categories.has('diversification')).toBe(true);
    expect(categories.has('provision_fund')).toBe(true);
    expect(categories.has('fscs')).toBe(true);
  });

  it('draws 5 random questions (1 from each category) with shuffled options', () => {
    const questions = getRandomAppropriatenessQuestions();
    expect(questions.length).toBe(5);

    const drawnCats = new Set(questions.map((q) => q.category));
    expect(drawnCats.size).toBe(5);
  });

  it('simulates KYC: fails when testName contains FAIL KYC', async () => {
    const failRes = await submitSimulatedKyc({
      userId: testUserId,
      testName: 'FAIL KYC Alex',
    });
    expect(failRes.verified).toBe(false);

    let status = await getOnboardingStatus(testUserId);
    expect(status.isKycVerified).toBe(false);

    // Now test successful verification
    const passRes = await submitSimulatedKyc({
      userId: testUserId,
      testName: 'Alex Morgan',
    });
    expect(passRes.verified).toBe(true);

    status = await getOnboardingStatus(testUserId);
    expect(status.isKycVerified).toBe(true);
    expect(status.nextStep).toBe('classification');
  });

  it('saves investor classification and advances stepper to appropriateness', async () => {
    await submitInvestorClassification({
      userId: testUserId,
      category: 'restricted',
    });

    const status = await getOnboardingStatus(testUserId);
    expect(status.classification).toBe('restricted');
    expect(status.nextStep).toBe('appropriateness');
  });

  it('enforces 24-hour wait after a failed appropriateness test (score < 4)', async () => {
    // Submit 5 deliberately wrong answers
    const wrongAnswers: Record<number, string> = {
      1: 'c', // wrong
      4: 'a', // wrong
      7: 'a', // wrong
      10: 'b', // wrong
      13: 'b', // wrong
    };

    const result = await submitAppropriatenessTest({
      userId: testUserId,
      answers: wrongAnswers,
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(4);
    expect(result.nextAttemptAllowedAt).not.toBeNull();

    // Trying again immediately must be rejected
    await expect(
      submitAppropriatenessTest({
        userId: testUserId,
        answers: wrongAnswers,
      })
    ).rejects.toThrow(/must wait/);
  });

  it('allows retesting after fast-forwarding time 24 hours', async () => {
    // Fast-forward 25 hours
    await ClockService.fastForwardHours(25);

    // Submit correct answers (pass mark >= 4)
    const correctAnswers: Record<number, string> = {
      1: 'a', // correct
      4: 'b', // correct
      7: 'b', // correct
      10: 'a', // correct
      13: 'a', // correct
    };

    const passResult = await submitAppropriatenessTest({
      userId: testUserId,
      answers: correctAnswers,
    });

    expect(passResult.passed).toBe(true);
    expect(passResult.score).toBe(5);
    expect(passResult.coolingOffEndsAt).not.toBeNull();

    const status = await getOnboardingStatus(testUserId);
    expect(status.appropriateness.passed).toBe(true);
    expect(status.coolingOff.active).toBe(true);
    expect(status.isReadyToInvest).toBe(false);
    expect(status.nextStep).toBe('cooling_off');
  });

  it('enforces cooling-off period and unlocks investment when completed', async () => {
    let status = await getOnboardingStatus(testUserId);
    expect(status.coolingOff.active).toBe(true);
    expect(status.isReadyToInvest).toBe(false);

    // Fast-forward 25 hours to clear cooling-off
    await ClockService.fastForwardHours(25);

    status = await getOnboardingStatus(testUserId);
    expect(status.coolingOff.active).toBe(false);
    expect(status.isReadyToInvest).toBe(true);
    expect(status.nextStep).toBe('ready');
  });
});
