"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State { loading: boolean; }
const initialState: State = { loading: false };

const resultSlice = createSlice({
  name: "result",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = resultSlice.actions;
export default resultSlice.reducer;
