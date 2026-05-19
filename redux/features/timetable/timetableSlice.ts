"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State { loading: boolean; }
const initialState: State = { loading: false };

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = timetableSlice.actions;
export default timetableSlice.reducer;
