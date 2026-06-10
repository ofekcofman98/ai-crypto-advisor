/**
 * auth.types.ts
 * DTOs, response interfaces, and token payload types for the Auth module.
 * All shapes here are the single source of truth for auth-related data contracts.
 * Spec reference: docs/specs_features.md §1
 */

export interface RegisterDTO {
  email: string;
  name: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
}