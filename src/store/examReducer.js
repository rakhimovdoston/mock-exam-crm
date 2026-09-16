import { createSlice } from "@reduxjs/toolkit";
import {
  countListHeaderOrDragDrop,
  getQuestionNumbers,
  getStartByQuestionType,
} from "../utils";

// ✅ Helper function to get the correct storage key
const getAnswersStorageKey = () => {
  // Get current URL to determine exam type
  const path = window.location.pathname;
  if (path.includes("listening")) {
    return null; // Listening exam answers are not saved
  }
  const examId = path.split("/").pop();

  if (path.includes("/reading/")) {
    return `exam_answers_reading_${examId}`;
  } else if (path.includes("/listening/")) {
    return `exam_answers_listening_${examId}`;
  }

  // Fallback
  return `exam_answers_${examId}`;
};

// Load saved answers from sessionStorage
const loadSavedAnswers = () => {
  try {
    const storageKey = getAnswersStorageKey();
    if (!storageKey) return [];
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading saved answers:", error);
    return [];
  }
};

// Save answers to sessionStorage
const saveAnswersToStorage = (answers) => {
  try {
    const storageKey = getAnswersStorageKey();
    if (!storageKey) return;
    sessionStorage.setItem(storageKey, JSON.stringify(answers));
  } catch (error) {
    console.error("Error saving answers:", error);
  }
};

const examReducer = createSlice({
  name: "exam",
  initialState: {
    answers: loadSavedAnswers(),
  },
  reducers: {
    initilalizeExam: (state, action) => {
      // If we already have saved answers, don't reinitialize
      if (state.answers.length > 0) {
        return;
      }

      const data = action.payload;

      const answers = data.map((element) => {
        const flatAnswers = [];

        element.questions.forEach((question) => {
          const quesNumbers = getQuestionNumbers(question);

          if (question.type === "Multiple Choice (Multiple answers)") {
            flatAnswers.push({
              keys: quesNumbers,
              values: [],
            });
          } else if (question.type === "Matching Headings") {
            const countHeader = countListHeaderOrDragDrop(element.content);
            const start = getStartByQuestionType(element.type);
            for (let i = start + 1; i <= start + countHeader; i++) {
              flatAnswers.push({
                key: i,
                value: "",
              });
            }
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
      // ✅ Save with specific key
      saveAnswersToStorage(answers);
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
      // ✅ Save after update
      saveAnswersToStorage(state.answers);
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
      // ✅ Save after update
      saveAnswersToStorage(state.answers);
    },
    /**
     * Apply a server-side draft on top of the initialised answer sheet.
     *
     * Merged by key rather than swapped in wholesale: the sheet's shape comes
     * from the paper that was just loaded, and a draft written against an older
     * version of it must not be able to reshape it.
     */
    restoreExamAnswers: (state, action) => {
      const saved = action.payload;
      if (!Array.isArray(saved)) return;

      const byKey = new Map();
      const byKeys = new Map();

      saved.forEach((part) => {
        (part?.answers || []).forEach((answer) => {
          if (answer?.key !== undefined) byKey.set(answer.key, answer.value);
          else if (answer?.keys !== undefined) byKeys.set(answer.keys, answer.values);
        });
      });

      state.answers.forEach((part) => {
        (part.answers || []).forEach((answer) => {
          if (answer.key !== undefined && byKey.has(answer.key)) {
            answer.value = byKey.get(answer.key) ?? "";
          } else if (answer.keys !== undefined && byKeys.has(answer.keys)) {
            const values = byKeys.get(answer.keys);
            answer.values = Array.isArray(values) ? values : [];
          }
        });
      });

      saveAnswersToStorage(state.answers);
    },
    clearExamAnswers: (state) => {
      state.answers = [];
      // ✅ Clear with specific key
      const storageKey = getAnswersStorageKey();
      sessionStorage.removeItem(storageKey);
    },
  },
});

export const {
  initilalizeExam,
  updateForUserAnswers,
  updateForUserMultipleAnswers,
  restoreExamAnswers,
  clearExamAnswers,
} = examReducer.actions;
export default examReducer.reducer;
