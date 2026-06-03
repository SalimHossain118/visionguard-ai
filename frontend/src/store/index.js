import { configureStore } from "@reduxjs/toolkit";
import inspectionReducer from "./inspectionSlice";

export const store = configureStore({
  reducer: {
    inspection: inspectionReducer,
  },
});

export default store;
