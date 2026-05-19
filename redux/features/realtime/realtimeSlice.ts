"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "../../store";

export const EventTypes = {
  SYNC_COMPLETED: "sync.completed",
  SYNC_FAILED: "sync.failed",
  ATTENDANCE_MARKED: "attendance.marked",
  EXAM_CREATED: "exam.created",
  RESULT_PUBLISHED: "result.published",
  FEE_PAID: "fee.paid",
  ANNOUNCEMENT_CREATED: "announcement.created",
  SESSION_EXPIRED: "auth.session_expired",
} as const;

interface RealtimeState {
  connectionStatus: "disconnected" | "connecting" | "connected";
  lastEventTimestamp: string | null;
  pendingUpdates: unknown[];
}

const initialState: RealtimeState = {
  connectionStatus: "disconnected",
  lastEventTimestamp: null,
  pendingUpdates: [],
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<RealtimeState["connectionStatus"]>) {
      state.connectionStatus = action.payload;
    },
    setLastEventTimestamp(state, action: PayloadAction<string>) {
      state.lastEventTimestamp = action.payload;
    },
    addPendingUpdate(state, action: PayloadAction<unknown>) {
      state.pendingUpdates.push(action.payload);
    },
    resetRealtimeState: () => initialState,
  },
});

export const { setConnectionStatus, setLastEventTimestamp, addPendingUpdate, resetRealtimeState } =
  realtimeSlice.actions;

export const handleRealtimeEvent =
  (eventPayload: { type: string; data: unknown }) => (dispatch: AppDispatch) => {
    const { type, data } = eventPayload;
    console.log(`[Realtime] Received ${type}:`, data);
    dispatch(addPendingUpdate(eventPayload));
  };

export default realtimeSlice.reducer;
