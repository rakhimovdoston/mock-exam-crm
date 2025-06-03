export const getValueFromAnswer = (key, answers) => {
  const answer = answers.find((a) => a.key === key);
  return answer ? answer.value : "";
};

export const getTitle = (type, questionTypes) => {
  if (!questionTypes) return "";
  const questionType = questionTypes.find((q) => q.type === type);
  return questionType ? questionType.name : "";
};

export const getInitValue = (data, type) => {
  const readingInit = data.find((init) => init.type === type);

  return readingInit
    ? readingInit.value
    : {
        type: "paragraph",
        children: [{ text: "" }],
      };
};

export const getQuestionNumbers = (question) => {
  if (question.type === "Multiple Choice (Multiple answers)")
    return getMinMaxFromMultipleAnswer(question.content);

  if (
    question.type === "Multiple Choice" ||
    question.type === "Multiple Choices"
  )
    return getMinMaxQuestionIds(question.content);

  const extractPlaceholders = (nodes) => {
    return nodes.flatMap((node) => {
      let placeholders = [];

      if (node.type === "input" && typeof node.placeholder === "number") {
        placeholders.push(node.placeholder);
      }

      if (Array.isArray(node.children)) {
        placeholders.push(...extractPlaceholders(node.children));
      }

      return placeholders;
    });
  };
  const placeholders = extractPlaceholders(question.content);
  if (placeholders.length === 0) {
    const result = getListMinMax(question.content);
    if (result) {
      return `${result.min}-${result.max}`;
    }
  }

  return placeholders[0] + "-" + placeholders[placeholders.length - 1];
};

export function getListMinMax(nodes) {
  for (const node of nodes) {
    if (node.type === "ordered-list" && Array.isArray(node.children)) {
      const start = typeof node.start === "number" ? node.start : 1;
      const itemCount = node.children.filter(
        (child) => child.type === "list-item"
      ).length;
      const min = start;
      const max = start + itemCount - 1;
      return { min, max };
    }
    if (node.children) {
      const result = getListMinMax(node.children);
      if (result) return result;
    }
  }
  return null;
}

export const getMinMaxFromMultipleAnswer = (content) => {
  const startInputIn = content
    .filter(
      (node) =>
        node.type === "multiple-choice-multiple-answer" &&
        node.startInputId !== undefined
    )
    .map((node) => node.startInputId);
  const questionCount = content
    .filter(
      (node) =>
        node.type === "multiple-choice-multiple-answer" &&
        node.questionNumber !== undefined
    )
    .map((node) => node.questionNumber);

  return (Number(startInputIn) + 1) + "-" + (Number(startInputIn) + Number(questionCount));
};

export const getMinMaxQuestionIds = (content) => {
  const ids = content
    .filter(
      (node) => node.type === "multiple-choice" && typeof node.id === "number"
    )
    .map((node) => node.id);

  return ids[0] + "-" + ids[ids.length - 1] || "";
};

export const getStartByQuestionType = (type, module = "READING") => {
  if (module === "READING") {
    switch (type) {
      case "easy":
        return 0;
      case "medium":
        return 13;
      case "hard":
        return 26;
      default:
        return 0;
    }
  }
  if (module === "LISTENING") {
    switch (type) {
      case "part_1":
        return 0;
      case "part_2":
        return 10;
      case "part_3":
        return 20;
      case "part_4":
        return 30;
      default:
        return 0;
    }
  }
  return 0;
};

export const getLastQuestionId = (questions) => {
  if (!questions || questions.length === 0) return 0;
  const lastQuestion = questions[questions.length - 1];

  if (lastQuestion.type === "Multiple Choice (Multiple answers)") {
    return Number(getMinMaxFromMultipleAnswer(lastQuestion.content).split("-")[1]);
  }
  let max = 0;

  function traverse(node) {
    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === "object" && node !== null) {
      if (node.type === "input" && typeof node.placeholder === "number") {
        max = Math.max(max, node.placeholder);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(lastQuestion.content);
  if (max === 0) {
    const result = getListMinMax(lastQuestion.content);
    if (result) {
      max = result.max;
    }
  }
  if (max === 0) {
    const questionIds = getMinMaxQuestionIds(lastQuestion.content);
    if (questionIds !== "") {
      const parts = questionIds.split("-");
      if (parts.length === 2) {
        max = parseInt(parts[1], 10);
      }
    }
  }
  return max;
};
