import React, { useState } from "react";
import { useDrag } from "../../contexts/DragContext";
import DraggableHeading from "../../DraggleHeadings";
import { useSelector } from "react-redux";

const ListItemViewDragAndDropElement = ({
  attributes,
  children,
  element,
  index,
  startNumber,
  is_passage = false,
}) => {
  const { onDropAnswer } = useDrag();
  const { answers } = useSelector((state) => state.answer);
  const questionNumber = startNumber + index;
  const [isOver, setIsOver] = useState(false);

  if (!is_passage) {
    return (
      <DraggableHeading
        element={element}
        attributes={attributes}
        children={children}
      />
    );
  }

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("drag-item");
    if (data) {
      const dropped = JSON.parse(data);
      onDropAnswer(questionNumber, dropped.value); // key: number, value: "A"/"B"
    }
  };

  const handleDragEnter = () => {
    setIsOver(true);
  };

  const handleDragLeave = () => {
    // setIsOver(false);
  };

  const getValue = (number) => {
    for (const ans of answers) {
      if (ans.key === number) {
        return ans.value;
      }
    }
    return null;
  };

  return (
    <div {...attributes}>
      {is_passage && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={{
            width: getValue(questionNumber) ? "fit-content" : 300,
            minHeight: 10,
            border: `2px dashed ${isOver ? "#1677FF" : "#aaa"}`, // 👈 Dynamic border
            borderRadius: 6,
            background: isOver ? "#e6f0ff" : "#fafafa",
            marginBottom: 6,
            fontSize: 14,
            display: "flex",
            padding: "1px 8px",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: 500,
          }}
        >
          {getValue(questionNumber) ? (
            <strong>{getValue(questionNumber)}</strong>
          ) : (
            <strong style={{ opacity: 0.5 }}>{questionNumber}</strong>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default ListItemViewDragAndDropElement;
