import React from "react";
import { useSelector } from "react-redux";
import { getPartLabel } from "../../utils";
import "../../styles/exam.css";

const ExamFooter = ({ selectPart, setSelectPart }) => {
  const { answers } = useSelector((state) => state.exam);
  const safeAnswers = Array.isArray(answers) ? answers : [];

  const getKeysNumbers = (keys) => {
    if (typeof keys !== "string" || !keys.includes("-")) return [];
    const [start, end] = keys.split("-");
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    if (Number.isNaN(startNum) || Number.isNaN(endNum)) return [];
    const numbers = [];
    for (let i = startNum; i <= endNum; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  // Flatten one part into question chips: { number, answered }
  const getQuestionChips = (part) =>
    (part.answers || []).flatMap((ans) => {
      if (ans.key) {
        return [{ number: ans.key, answered: Boolean(ans.value) }];
      }
      const answeredCount = ans.values?.length ?? 0;
      return getKeysNumbers(ans.keys).map((number, idx) => ({
        number,
        answered: idx < answeredCount,
      }));
    });

  return (
    <footer className="exam-partnav exam-partnav--questions">
      {safeAnswers.map((part, index) => {
        const chips = getQuestionChips(part);
        const answeredCount = chips.filter((chip) => chip.answered).length;
        const isActive = selectPart === part.type;

        return (
          <div
            key={part.type ?? index}
            role="button"
            tabIndex={0}
            onClick={() => setSelectPart(part.type)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectPart(part.type);
              }
            }}
            className={`exam-partnav__item${
              isActive ? " exam-partnav__item--active" : ""
            }`}
          >
            <span className="exam-partnav__label">
              {getPartLabel(part.type, index)}
              <span
                style={{ opacity: 0.6, fontWeight: 500, marginInlineStart: 6 }}
              >
                {answeredCount}/{chips.length}
              </span>
            </span>

            {/* Same nodes in both states: the chips morph between numbers and
                dots, cascading from the left as a part opens. */}
            <span className="exam-partnav__dots">
              {chips.map((chip, chipIndex) => (
                <span
                  key={`${chip.number}-${chipIndex}`}
                  className={[
                    "exam-qdot",
                    chip.answered ? "exam-qdot--filled" : "",
                    isActive ? "" : "exam-qdot--collapsed",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    // Numbers collapse at once, but only expand after the part
                    // that was open has finished folding its own away.
                    transitionDelay: isActive
                      ? `${200 + chipIndex * 14}ms`
                      : "0ms",
                  }}
                >
                  {chip.number}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </footer>
  );
};

export default ExamFooter;
