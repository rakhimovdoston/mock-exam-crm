import { createSlice } from "@reduxjs/toolkit";

const answerReducer = createSlice({
  name: "answers",
  initialState: {
    answers: [],
  },
  reducers: {
    initializeAnswers: (state, action) => {
        const { numberOfAnswers, startNumber, initKeys } = action.payload;
        const answers = [];
        let i = startNumber;
        if (!initKeys || initKeys.length < 0) 
            initKeys = [];
      
        while (i <= numberOfAnswers) {
          const match = initKeys.find((key) => {
            const [start, end] = key.split("-").map(Number);
            return i === start;
          });
      
          if (match) {
            const [start, end] = match.split("-").map(Number);
            answers.push({ keys: match, values: [] });
            i = end + 1;
          } else {
            answers.push({ key: i, value: "" });
            i++;
          }
        }
      
        state.answers = answers;
    },
    updateAnswer: (state, action) => {
      const { key, value } = action.payload;
      const index = state.answers.findIndex((a) => a.key === key);
      if (index !== -1) {
        state.answers[index].value = value;
      }
    },
    updateMultipleAnswer: (state, action) => {
      const { keys, values } = action.payload;
      
      state.answers = state.answers.map((answer) => {
        if (answer.keys === keys) {
            if (answer.values && answer.values.includes(values)) {
                answer.values = answer.values.filter((v) => v !== values);
            } else {
                answer.values.push(values);
            }
            return answer;
        }
        return answer;
      });
    },
    setAnswers: (state, action) => {
      state.answers = action.payload;
    },
    clearAnswers: (state) => {
      state.answers = [];
    },
  },
});

export const { initializeAnswers, updateAnswer, setAnswers, clearAnswers, updateMultipleAnswer } =
  answerReducer.actions;

export default answerReducer.reducer;
