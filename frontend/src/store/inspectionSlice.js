import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Current inspection result
  currentInspection: null,
  isLoading: false,
  error: null,

  // Selected category
  category: "metal_nut",

  // Inspection history
  history: [],

  // System status
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
      // Add to history
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
  },
});

export const {
  setLoading,
  setInspectionResult,
  setError,
  setCategory,
  clearCurrentInspection,
} = inspectionSlice.actions;

export default inspectionSlice.reducer;
