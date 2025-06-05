import { createSlice } from "@reduxjs/toolkit";
import { getQuestionNumbers } from "../utils";

const examReducer = createSlice({
  name: "exam",
  initialState: {
    answers: [],
  },
  reducers: {
    initilalizeExam: (state, action) => {
      const data = action.payload;
      const answers = data.map((element) => {
        // We'll collect all questions in a flat array
        const flatAnswers = [];

        element.questions.forEach((question) => {
          const quesNumbers = getQuestionNumbers(question);

          if (question.type === "Multiple Choice (Multiple answers)") {
            flatAnswers.push({
              keys: quesNumbers,
              values: [],
            });
          } else {
            const [start, end] = quesNumbers.split("-").map(Number);
            for (let i = start; i <= end; i++) {
              flatAnswers.push({
                key: i,
                value: "",
              });
            }
          }
        });

        return {
          type: element.type,
          passageId: element.id,
          answers: flatAnswers,
        };
      });

      state.answers = answers;
    },
    updateForUserAnswers: (state, action) => {
      const { key, value } = action.payload;
      state.answers.forEach((answer) => {
        answer.answers.forEach((group) => {
          if (group.key === key) {
            group.value = value;
          }
        });
      });
    },
    updateForUserMultipleAnswers: (state, action) => {
      const { keys, values } = action.payload;
      state.answers.forEach((answer) => {
        answer.answers.forEach((group) => {
          if (group.keys === keys) {
            if (group.values && group.values.includes(values)) {
              group.values = group.values.filter((v) => v !== values);
            } else {
              group.values.push(values);
            }
          }
        });
      });
    },
  },
});

export const {
  initilalizeExam,
  updateForUserAnswers,
  updateForUserMultipleAnswers,
} = examReducer.actions;
export default examReducer.reducer;
