// DrainSense India — Authentication & Session Utility
// Secure client-side session persistence. No credentials or passwords stored client-side.

export interface UserSession {
  name: string;
  username: string;
  role: string;
  email: string;
  department: string;
  badge_id: string;
}

const AUTH_TOKEN_KEY = "drainsense_token";
const AUTH_USER_KEY = "drainsense_user";

export function getStoredSession(): { token: string | null; user: UserSession | null } {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const userJson = localStorage.getItem(AUTH_USER_KEY);

  let user: UserSession | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }

  return { token, user };
}

export function setStoredSession(token: string, user: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isUserAuthenticated(): boolean {
  const { token, user } = getStoredSession();
  return Boolean(token && user);
}
