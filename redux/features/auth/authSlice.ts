"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  token?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const readLocal = (key: string): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
};

const initialState: AuthState = {
  user: readLocal("educore_user"),
  token: typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  isAuthenticated: typeof window !== "undefined" ? Boolean(localStorage.getItem("accessToken")) : false,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      const u = action.payload;
      state.user = u;
      state.token = u.token ?? state.token;
      state.isAuthenticated = true;
      try {
        localStorage.setItem("educore_user", JSON.stringify(u));
        if (u.token) localStorage.setItem("accessToken", u.token);
      } catch {}
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem("educore_user");
        localStorage.removeItem("accessToken");
      } catch {}
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
