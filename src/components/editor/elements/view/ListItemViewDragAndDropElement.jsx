import React, { useState } from "react";
import { useDrag } from "../../contexts/DragContext";
import DraggableHeading from "../../DraggleHeadings";
import { useSelector } from "react-redux";
import { ReactEditor, useSlateStatic } from "slate-react";
import { Node } from "slate";

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
  const examAnswers = useSelector((state) => state.exam)
  const questionNumber = startNumber + index;
  const [isOver, setIsOver] = useState(false);
  const questionType = element.questionsType || null;
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const parentNode = Node.get(editor, path.slice(0, -1));

  if (!is_passage && questionType != "Matching Sentence Endings") {
    return (
      <DraggableHeading
        element={element}
        attributes={attributes}
        children={children}
      />
    );
  }

  if (
    questionType === "Matching Sentence Endings" &&
    parentNode?.type === "unordered-list"
  ) {
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
      onDropAnswer(questionNumber, dropped.value);
    }
  };

  const handleDragEnter = () => {
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const getValue = (number) => {
    if (answers.length > 0) {
      for (const ans of answers) {
        if (ans.key === number) {
          return ans.value;
        }
      }
    } else {
      for (const examAnswer of examAnswers.answers) {
        for (const exAns of examAnswer.answers) {
          if (exAns.key === number) {
            return exAns.value;
          }
        }
      }
    }
    return null;
  };

  if (
    questionType === "Matching Sentence Endings" &&
    parentNode?.type !== "unordered-list"
  ) {
    let start = 1;
    if (
      parentNode &&
      parentNode.type === "ordered-list" &&
      typeof parentNode.start === "number"
    ) {
      start = parentNode.start;
    }

    const listItemIndex = path[path.length - 1];
    const itemNumber = start + listItemIndex;
    return (
      <li {...attributes}>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <p style={{ margin: "0", padding: "0" }}>{children}</p>
          <div
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData("drag-item");
              if (data) {
                const dropped = JSON.parse(data);
                onDropAnswer(itemNumber, dropped.value);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            style={{
              width: "fit-content",
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
            {getValue(itemNumber) ? (
              <strong>{getValue(itemNumber)}</strong>
            ) : (
              <strong style={{ opacity: 0.5 }}>Drop here</strong>
            )}
          </div>
        </div>
      </li>
    );
  }

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
