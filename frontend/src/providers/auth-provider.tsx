
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  refreshAccessToken,
} from "@/lib/api/auth";

import type {
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (
    payload: LoginPayload
  ) => Promise<User>;

  register: (
    payload: RegisterPayload
  ) => Promise<User>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<User | null>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /**
   * Ask Django who the current user is.
   *
   * There is deliberately NO localStorage token check.
   *
   * The browser automatically sends the HttpOnly
   * gbyt_access cookie.
   */
  const refreshUser = useCallback(
    async (): Promise<User | null> => {
      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch (error) {
        /**
         * A 401 normally means the access token has
         * expired or the user is not authenticated.
         *
         * Try the refresh cookie before declaring
         * the user logged out.
         */
        try {
          await refreshAccessToken();

          const currentUser =
            await getCurrentUser();

          setUser(currentUser);

          return currentUser;
        } catch (refreshError) {
          /**
           * There is no usable authentication session.
           *
           * We do NOT remove anything from localStorage
           * because authentication tokens are not stored there.
           */
          console.debug(
            "No active authentication session.",
            refreshError
          );

          setUser(null);

          return null;
        }
      }
    },
    []
  );

  /**
   * Initialize authentication when the provider mounts.
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (mounted) {
          await refreshUser();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  /**
   * Login.
   *
   * Django sets the HttpOnly authentication cookies.
   */
  const login = useCallback(
    async (
      payload: LoginPayload
    ): Promise<User> => {
      await loginRequest(payload);

      const currentUser =
        await getCurrentUser();

      setUser(currentUser);

      return currentUser;
    },
    []
  );

  /**
   * Register.
   *
   * Django creates the account and establishes
   * the authenticated cookie session.
   */
  const register = useCallback(
    async (
      payload: RegisterPayload
    ): Promise<User> => {
      const response =
        await registerRequest(payload);

      setUser(response.user);

      return response.user;
    },
    []
  );

  /**
   * Logout.
   *
   * Django blacklists the refresh token and
   * clears the authentication cookies.
   */
  const logout = useCallback(
    async (): Promise<void> => {
      try {
        await logoutRequest();
      } finally {
        setUser(null);
      }
    },
    []
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside an AuthProvider"
    );
  }

  return context;
}
