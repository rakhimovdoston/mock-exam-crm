import React from "react";

const MultipleChoiceMultipleAnswerElement = ({
  attributes,
  element,
  children,
}) => {
  // const { size } = useSelector((state) => state.app);

  const getValue = (questionNumber) => {
    switch (questionNumber) {
      case 1:
        return "ONE";
      case 2:
        return "TWO";
      case 3:
        return "THREE";
      case 4:
        return "FOUR";
      default:
        return `ONE`;
    }
  };

  const getLetters = (options) => {
    return String.fromCharCode(65) + "-" + String.fromCharCode(65 + 5);
  };

  return (
    <div
      {...attributes}
      style={{
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div>
        <em>
          Choose <b>{getValue(element.questionNumber)}</b> letters{" "}
          <b>{getLetters(element.options)}</b>
        </em>
      </div>
      {/* {element.options.map((opt, index) => (
          <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ fontWeight: "bold" }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <Checkbox
              checked={checkIsAnswer(opt, answers)}
              onChange={(e) => {
                if (answers.length > 0) {
                  dispatch(
                    updateMultipleAnswer({ keys: getKeys(), values: opt })
                  );
                } else {
                  dispatch(
                    updateForUserMultipleAnswers({
                      keys: getKeys(),
                      values: opt,
                    })
                  );
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: `${size}px`,
              }}
            >
              <span>{opt}</span>
            </Checkbox>
          </div>
        ))} */}
      {children}
    </div>
  );
};

export default MultipleChoiceMultipleAnswerElement;
