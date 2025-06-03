import { createSlice } from "@reduxjs/toolkit";

const questionReducer = createSlice({
  name: "questions",
  initialState: {
    questionType: null,
    headingOptions: [],
  },
  reducers: {
    setQuestionType(state, action) {
      state.questionType = action.payload;
    },
    setHeadingOptions(state, action) {
      state.headingOptions = action.payload;
    }
  }
});

export const { setQuestionType, setHeadingOptions } = questionReducer.actions;
export default questionReducer.reducer;
