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

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

import { setAuthToken, removeAuthToken, setStoredUser, removeStoredUser } from '@/lib/utils/authStorage';

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
        if (typeof window !== "undefined") {
          // keep a synchronous localStorage copy for initial load
          try { window.localStorage.setItem("educore_user", JSON.stringify(u)); } catch {}
          if (u.token) {
            try { window.localStorage.setItem("accessToken", u.token); } catch {}
            setAuthToken(u.token).catch(() => {});
          }
          // store user as well in secure storage (optional)
          setStoredUser(u).catch(() => {});
        }
      } catch {}
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      try {
        if (typeof window !== "undefined") {
          try { window.localStorage.removeItem("educore_user"); } catch {}
          try { window.localStorage.removeItem("accessToken"); } catch {}
          removeAuthToken().catch(() => {});
          removeStoredUser().catch(() => {});
        }
      } catch {}
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
