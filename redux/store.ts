"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import schoolReducer from "./features/school/schoolSlice";
import studentReducer from "./features/student/studentSlice";
import teacherReducer from "./features/teacher/teacherSlice";
import attendanceReducer from "./features/attendance/attendanceSlice";
import examReducer from "./features/exam/examSlice";
import resultReducer from "./features/result/resultSlice";
import feeReducer from "./features/fee/feeSlice";
import aiReducer from "./features/ai/aiSlice";
import timetableReducer from "./features/timetable/timetableSlice";
import calendarReducer from "./features/calendar/calendarSlice";
import libraryReducer from "./features/library/librarySlice";
import announcementReducer from "./features/announcement/announcementSlice";
import analyticsReducer from "./features/analytics/analyticsSlice";
import offlineSyncReducer from "./features/offlineSync/offlineSyncSlice";
import realtimeReducer from "./features/realtime/realtimeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    school: schoolReducer,
    student: studentReducer,
    teacher: teacherReducer,
    attendance: attendanceReducer,
    exam: examReducer,
    result: resultReducer,
    fee: feeReducer,
    ai: aiReducer,
    timetable: timetableReducer,
    calendar: calendarReducer,
    library: libraryReducer,
    announcement: announcementReducer,
    analytics: analyticsReducer,
    offlineSync: offlineSyncReducer,
    realtime: realtimeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
