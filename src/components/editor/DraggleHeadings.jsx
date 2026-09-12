import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";

const DraggableHeading = ({ element }) => {
  const text = element.children[0]?.text;
  const { answers } = useSelector((state) => state.answer);
  const examAnswers = useSelector((state) => state.exam);
  const { size } = useSelector((state) => state.app);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "drag-item",
      JSON.stringify({
        id: element.id,
        value: text,
        from: "bank",
      })
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const isUsed = () => {
    const usedInUserAnswers = answers.some((ans) => ans.value === text);
    const usedInExamAnswers = examAnswers.answers.some((examAnswer) =>
      examAnswer.answers.some((exAns) => exAns.value === text)
    );
    return usedInUserAnswers || usedInExamAnswers;
  };

  const used = isUsed();

  return (
    <div
      ref={dragRef}
      // Placed items are hidden by .exam-chip--used, so only the words still
      // available stay in the bank.
      aria-hidden={used || undefined}
      draggable={!used}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={[
        "exam-chip",
        isDragging ? "exam-chip--dragging" : "",
        used ? "exam-chip--used" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: `${size}px` }}
    >
      {text}
    </div>
  );
};

export default DraggableHeading;
