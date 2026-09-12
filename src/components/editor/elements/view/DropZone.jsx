import React, { useState } from "react";

/**
 * A single answer slot for drag & drop questions.
 *
 * Filled slots are draggable themselves, so an answer can be moved straight to
 * another slot or dragged back onto the word bank; the × clears it in place.
 */
const DropZone = ({
  questionNumber,
  value,
  onDropAnswer,
  onClearAnswer,
  fontSize,
  showNumber = true,
  emptyWidth,
  placeholder = "Drop your answer",
  style,
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);

    const raw = event.dataTransfer.getData("drag-item");
    if (!raw) return;

    try {
      const dropped = JSON.parse(raw);
      onDropAnswer?.(
        questionNumber,
        dropped.value,
        dropped.from === "target" ? dropped.questionNumber : null
      );
    } catch (error) {
      console.error("Invalid drag payload:", error);
    }
  };

  const handleDragStart = (event) => {
    if (!value) return;
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "drag-item",
      JSON.stringify({ value, from: "target", questionNumber })
    );
  };

  const className = [
    "exam-drop",
    isOver ? "exam-drop--over" : "",
    value ? "exam-drop--filled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      contentEditable={false}
      draggable={Boolean(value)}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      className={className}
      style={{
        fontSize: fontSize ? `${fontSize}px` : undefined,
        minWidth: value ? undefined : emptyWidth,
        ...style,
      }}
    >
      {showNumber && (
        <span className="exam-drop__num">{questionNumber}</span>
      )}

      {value ? (
        <span className="exam-drop__value">{value}</span>
      ) : (
        <span className="exam-drop__placeholder">{placeholder}</span>
      )}

      {value && onClearAnswer && (
        <button
          type="button"
          className="exam-drop__clear"
          aria-label={`Clear answer ${questionNumber}`}
          title="Remove answer"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onClearAnswer(questionNumber);
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default DropZone;
