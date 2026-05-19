"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State { loading: boolean; }
const initialState: State = { loading: false };

const announcementSlice = createSlice({
  name: "announcement",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = announcementSlice.actions;
export default announcementSlice.reducer;
