import { getItem as secureGetItem, setItem as secureSetItem, removeItem as secureRemoveItem } from "@/lib/utils/secureStorage";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_STORAGE_KEY = "educore_user";

export interface StoredAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  schoolId?: string;
  token?: string;
  [key: string]: unknown;
}

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const token = await secureGetItem(ACCESS_TOKEN_KEY);
    if (token) return token;
  } catch {
    // ignore secure storage failures
  }

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await secureSetItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // ignore plugin failures
  }

  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // ignore localStorage failures
  }
}

export async function removeAuthToken(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await secureRemoveItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore secure storage failures
  }

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore localStorage failures
  }
}

export async function getStoredUser(): Promise<StoredAuthUser | null> {
  if (typeof window === "undefined") return null;

  const serialized = await getStoredUserString();
  if (!serialized) return null;

  try {
    return JSON.parse(serialized) as StoredAuthUser;
  } catch {
    return null;
  }
}

export async function getStoredUserString(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const value = await secureGetItem(USER_STORAGE_KEY);
    if (value) return value;
  } catch {
    // ignore
  }

  try {
    return window.localStorage.getItem(USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setStoredUser(user: StoredAuthUser): Promise<void> {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(user);

  try {
    await secureSetItem(USER_STORAGE_KEY, serialized);
  } catch {
    // ignore
  }

  try {
    window.localStorage.setItem(USER_STORAGE_KEY, serialized);
  } catch {
    // ignore
  }
}

export async function removeStoredUser(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await secureRemoveItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }

  try {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
}
