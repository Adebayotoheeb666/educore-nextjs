"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State { loading: boolean; }
const initialState: State = { loading: false };

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = librarySlice.actions;
export default librarySlice.reducer;
