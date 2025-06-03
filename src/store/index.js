import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authReducer";
import questionReducer from "./questionReducer";
import answerReducer from "./answerReducer";

const store = configureStore({
  reducer: {
    auth: authReducer,
    question: questionReducer,
    answer: answerReducer,
  },
});

export default store;
