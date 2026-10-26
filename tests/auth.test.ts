import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  createSessionToken,
  verifySessionToken,
  registerUser,
  loginUser,
  UserSession,
} from '@/lib/auth';
import { getDb, closeDb } from '@/lib/db';

describe('Auth & Roles Service', () => {
  beforeAll(async () => {
    await getDb('memory://');
  });

  afterAll(async () => {
    await closeDb();
  });

  it('validates password strength: requires 12+ characters', () => {
    expect(validatePasswordStrength('short123')).toBe(false);
    expect(validatePasswordStrength('12345678901')).toBe(false);
    expect(validatePasswordStrength('AtlasDemo!2026')).toBe(true);
    expect(validatePasswordStrength('123456789012')).toBe(true);
  });

  it('hashes and verifies passwords securely', async () => {
    const raw = 'SecurePassphrase!2026';
    const hash = await hashPassword(raw);
    expect(hash).not.toEqual(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await verifyPassword(raw, hash);
    expect(matches).toBe(true);

    const wrong = await verifyPassword('WrongPassword123', hash);
    expect(wrong).toBe(false);
  });

  it('signs and verifies JWT session tokens with claims', async () => {
    const sessionData: UserSession = {
      userId: '11111111-2222-3333-4444-555555555555',
      email: 'investor@atlas.demo',
      role: 'investor',
      accountState: 'pending_kyc',
      fullName: 'Dani Test',
    };

    const token = await createSessionToken(sessionData);
    expect(typeof token).toBe('string');

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(sessionData.userId);
    expect(decoded?.email).toBe(sessionData.email);
    expect(decoded?.role).toBe('investor');
    expect(decoded?.accountState).toBe('pending_kyc');
  });

  it('registers an investor with pending_kyc state', async () => {
    const user = await registerUser({
      email: 'dani@example.co.uk',
      password: 'StrongPassword123!',
      fullName: 'Dani Jones',
      dateOfBirth: '1990-05-15',
      postcode: 'SW1A 1AA',
    });

    expect(user.userId).toBeDefined();
    expect(user.email).toBe('dani@example.co.uk');
    expect(user.role).toBe('investor');
    expect(user.accountState).toBe('pending_kyc');
  });

  it('rejects duplicate email registration', async () => {
    await expect(
      registerUser({
        email: 'dani@example.co.uk',
        password: 'AnotherStrongPassword123!',
        fullName: 'Dani Duplicate',
        dateOfBirth: '1990-05-15',
        postcode: 'SW1A 1AA',
      })
    ).rejects.toThrow('Email already registered');
  });

  it('logs in successfully with valid credentials', async () => {
    const { user, token } = await loginUser('dani@example.co.uk', 'StrongPassword123!');
    expect(user.email).toBe('dani@example.co.uk');
    expect(token).toBeDefined();
  });

  it('rejects invalid password on login', async () => {
    await expect(
      loginUser('dani@example.co.uk', 'IncorrectPassword123!')
    ).rejects.toThrow('Invalid email or password');
  });
});
