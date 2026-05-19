"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State { loading: boolean; }
const initialState: State = { loading: false };

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = aiSlice.actions;
export default aiSlice.reducer;
