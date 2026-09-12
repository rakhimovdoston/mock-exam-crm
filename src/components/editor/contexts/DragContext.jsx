import React, { createContext, useContext, useMemo, useState } from "react";

export const DragContext = createContext();

export const useDrag = () => useContext(DragContext) || {};

/**
 * Drop props for a word bank: dropping an answer that came from a question
 * slot back onto the bank clears that slot, so a candidate can undo a drop by
 * dragging it back where it came from.
 */
export const useReturnDrop = () => {
  const { onClearAnswer } = useDrag();
  const [isOver, setIsOver] = useState(false);

  const dropProps = {
    onDragOver: (event) => {
      if (onClearAnswer) event.preventDefault();
    },
    onDragEnter: () => {
      if (onClearAnswer) setIsOver(true);
    },
    onDragLeave: () => setIsOver(false),
    onDrop: (event) => {
      setIsOver(false);
      if (!onClearAnswer) return;
      const raw = event.dataTransfer.getData("drag-item");
      if (!raw) return;
      event.preventDefault();
      try {
        const dropped = JSON.parse(raw);
        if (dropped.from === "target" && dropped.questionNumber != null) {
          onClearAnswer(dropped.questionNumber);
        }
      } catch (error) {
        console.error("Invalid drag payload:", error);
      }
    },
  };

  return { isOver: isOver && Boolean(onClearAnswer), dropProps };
};

export const DragProvider = ({ onDropAnswer, onClearAnswer, children }) => {
  const value = useMemo(
    () => ({ onDropAnswer, onClearAnswer }),
    [onDropAnswer, onClearAnswer]
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
};
