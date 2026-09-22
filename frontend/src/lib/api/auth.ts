
import {
  apiGet,
  apiPost,
  apiPatch,
} from "./client";

import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  User,
} from "@/types/auth";

/**
 * Register a new customer.
 *
 * Django creates the authentication cookies:
 * - gbyt_access
 * - gbyt_refresh
 *
 * The JWTs are HttpOnly and are therefore NOT accessible
 * to JavaScript.
 */
export async function register(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>(
    "/auth/register/",
    payload
  );
}

/**
 * Login an existing customer.
 *
 * Django sets the authentication cookies in the response.
 */
export async function login(
  payload: LoginPayload
): Promise<LoginResponse> {
  return apiPost<LoginResponse>(
    "/auth/login/",
    payload
  );
}

/**
 * Get the currently authenticated user.
 *
 * Django authenticates the request using the
 * HttpOnly gbyt_access cookie.
 */
export async function getCurrentUser(): Promise<User> {
  return apiGet<User>(
    "/account/me/",
    true
  );
}

/**
 * Update the currently authenticated user's
 * basic account information.
 */
export async function updateCurrentUser(
  payload: Partial<{
    first_name: string;
    last_name: string;
  }>
): Promise<User> {
  return apiPatch<User>(
    "/account/me/",
    payload,
    true
  );
}

/**
 * Refresh the authentication session.
 *
 * IMPORTANT:
 * The refresh JWT is NOT passed from JavaScript.
 *
 * Django reads gbyt_refresh directly from the
 * HttpOnly cookie and issues a new access token.
 *
 * When refresh-token rotation is enabled, Django
 * also replaces the refresh cookie.
 */
export async function refreshAccessToken(): Promise<void> {
  await apiPost(
    "/auth/refresh/",
    undefined,
    false
  );
}

/**
 * Logout the current user.
 *
 * Django reads the refresh token from the HttpOnly
 * cookie, blacklists it, and clears both auth cookies.
 */
export async function logout(): Promise<void> {
  await apiPost(
    "/auth/logout/",
    undefined,
    true
  );
}
