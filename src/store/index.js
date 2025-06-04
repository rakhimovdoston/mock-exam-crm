import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authReducer";
import questionReducer from "./questionReducer";
import answerReducer from "./answerReducer";
import examReducer from "./examReducer";

const store = configureStore({
  reducer: {
    auth: authReducer,
    question: questionReducer,
    answer: answerReducer,
    exam: examReducer, // Assuming you have an examReducer
  },
});

export default store;
