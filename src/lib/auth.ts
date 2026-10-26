import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';
import { recordAuditLog } from './audit';
import { ClockService } from './clock';

export type UserRole = 'investor' | 'admin' | 'compliance';
export type AccountState = 'pending_kyc' | 'verified' | 'restricted' | 'closed';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  date_of_birth: string;
  postcode: string;
  role: UserRole;
  account_state: AccountState;
  created_at: string;
}

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  accountState: AccountState;
  fullName: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'atlas_demo_super_secret_jwt_key_at_least_32_chars_long!'
);
export const COOKIE_NAME = 'atlas_session';

/**
 * Validates password meets minimum 12-character requirement
 */
export function validatePasswordStrength(password: string): boolean {
  return typeof password === 'string' && password.length >= 12;
}

/**
 * Hashes password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a signed JWT session token
 */
export async function createSessionToken(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a JWT session token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      accountState: payload.accountState as AccountState,
      fullName: payload.fullName as string,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to get the current logged-in user from incoming HTTP cookies
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Registers a new user and logs an audit trail
 */
export async function registerUser(params: {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  postcode: string;
  role?: UserRole;
  ip?: string;
}): Promise<UserSession> {
  if (!validatePasswordStrength(params.password)) {
    throw new Error('Password must be at least 12 characters long');
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(params.password);
  const now = await ClockService.now();
  const role: UserRole = params.role || 'investor';
  const accountState: AccountState = role === 'admin' || role === 'compliance' ? 'verified' : 'pending_kyc';

  const res = await query<UserRecord>(
    `INSERT INTO users (email, password_hash, full_name, date_of_birth, postcode, role, account_state, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, full_name, date_of_birth, postcode, role, account_state, created_at`,
    [
      normalizedEmail,
      passwordHash,
      params.fullName.trim(),
      params.dateOfBirth,
      params.postcode.trim().toUpperCase(),
      role,
      accountState,
      now.toISOString(),
    ]
  );

  const newUser = res.rows[0];

  await recordAuditLog({
    actorUserId: newUser.id,
    action: 'USER_REGISTERED',
    entityType: 'users',
    entityId: newUser.id,
    after: {
      email: newUser.email,
      role: newUser.role,
      account_state: newUser.account_state,
    },
    ip: params.ip,
  });

  return {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    accountState: newUser.account_state,
    fullName: newUser.full_name,
  };
}

/**
 * Authenticates a user with email and password
 */
export async function loginUser(
  email: string,
  password: string,
  ip?: string
): Promise<{ user: UserSession; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await query<UserRecord>(
    'SELECT id, email, password_hash, full_name, role, account_state FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    await recordAuditLog({
      action: 'LOGIN_FAILED_UNKNOWN_EMAIL',
      entityType: 'users',
      after: { email: normalizedEmail },
      ip,
    });
    throw new Error('Invalid email or password');
  }

  const user = res.rows[0];
  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    await recordAuditLog({
      actorUserId: user.id,
      action: 'LOGIN_FAILED_INVALID_PASSWORD',
      entityType: 'users',
      entityId: user.id,
      ip,
    });
    throw new Error('Invalid email or password');
  }

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    accountState: user.account_state,
    fullName: user.full_name,
  };

  const token = await createSessionToken(session);

  await recordAuditLog({
    actorUserId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'users',
    entityId: user.id,
    ip,
  });

  return { user: session, token };
}
