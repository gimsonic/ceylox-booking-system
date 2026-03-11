import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────
// 📘 LESSON: Centralizing auth logic
//
// Instead of calling AsyncStorage.setItem('token', ...)
// scattered across every screen, we put ALL auth logic
// in one file. Benefits:
//   1. One place to update if storage keys change
//   2. Every screen imports the same functions
//   3. Easy to swap AsyncStorage for a different solution later
// ─────────────────────────────────────────────

const KEYS = {
  TOKEN: "auth_token",
  USER_ID: "user_id",
  USER_NAME: "user_name",
  USER_EMAIL: "user_email",
};

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  token: string;
}

// Save everything after login or signup
export const saveAuthSession = async (user: AuthUser): Promise<void> => {
  await AsyncStorage.multiSet([
    [KEYS.TOKEN, user.token],
    [KEYS.USER_ID, user.id],
    [KEYS.USER_NAME, user.full_name],
    [KEYS.USER_EMAIL, user.email],
  ]);
};

// Read the current session (returns null if not logged in)
export const getAuthSession = async (): Promise<AuthUser | null> => {
  const results = await AsyncStorage.multiGet([
    KEYS.TOKEN,
    KEYS.USER_ID,
    KEYS.USER_NAME,
    KEYS.USER_EMAIL,
  ]);

  const [token, id, full_name, email] = results.map((r) => r[1]);

  if (!token || !id) return null;

  return { token, id, full_name: full_name ?? "", email: email ?? "" };
};

// Get just the token — used in API calls for Authorization header
export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.TOKEN);
};

// Clear everything on logout
export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};
