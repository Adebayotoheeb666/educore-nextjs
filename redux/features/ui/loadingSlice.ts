"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

const initialState: LoadingState = {
  isLoading: false,
  message: undefined,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<{ isLoading: boolean; message?: string }>) {
      state.isLoading = action.payload.isLoading;
      state.message = action.payload.message;
    },
    startLoading(state, action: PayloadAction<string | undefined>) {
      state.isLoading = true;
      state.message = action.payload;
    },
    stopLoading(state) {
      state.isLoading = false;
      state.message = undefined;
    },
  },
});

export const { setLoading, startLoading, stopLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
