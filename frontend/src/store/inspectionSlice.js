import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentInspection: null,
  isLoading: false,
  error: null,
  category: "metal_nut",
  history: [],
  systemStatus: "online",
};

const inspectionSlice = createSlice({
  name: "inspection",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setInspectionResult: (state, action) => {
      state.currentInspection = action.payload;
      state.isLoading = false;
      state.error = null;
      state.history.unshift({
        ...action.payload,
        timestamp: new Date().toISOString(),
        id: Date.now(),
      });
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
    },
    clearCurrentInspection: (state) => {
      state.currentInspection = null;
      state.error = null;
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const {
  setLoading,
  setInspectionResult,
  setError,
  setCategory,
  clearCurrentInspection,
  setHistory,
  clearHistory,
} = inspectionSlice.actions;

export default inspectionSlice.reducer;
