import React from "react";
import { useDrag } from "../../contexts/DragContext";
import DraggableHeading from "../../DraggleHeadings";
import { useSelector } from "react-redux";
import { ReactEditor, useSlateStatic } from "slate-react";
import { Node } from "slate";
import DropZone from "./DropZone";

const ListItemViewDragAndDropElement = ({
  attributes,
  children,
  element,
  index,
  startNumber,
  is_passage = false,
}) => {
  const { onDropAnswer, onClearAnswer } = useDrag();
  const { answers } = useSelector((state) => state.answer);
  const examAnswers = useSelector((state) => state.exam);
  const questionNumber = startNumber + index;
  const { size } = useSelector((state) => state.app);
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
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <p style={{ margin: "0", padding: "0", fontSize: `${size}px` }}>
            {children}
          </p>
          <DropZone
            questionNumber={itemNumber}
            value={getValue(itemNumber)}
            onDropAnswer={onDropAnswer}
            onClearAnswer={onClearAnswer}
            fontSize={size}
            showNumber={false}
            emptyWidth={140}
          />
        </div>
      </li>
    );
  }

  return (
    <div {...attributes}>
      {is_passage && (
        <div style={{ marginBottom: 8 }}>
          <DropZone
            questionNumber={questionNumber}
            value={getValue(questionNumber)}
            onDropAnswer={onDropAnswer}
            onClearAnswer={onClearAnswer}
            fontSize={size}
            emptyWidth={280}
          />
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default ListItemViewDragAndDropElement;
