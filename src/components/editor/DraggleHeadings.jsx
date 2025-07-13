import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";

const DraggableHeading = ({ element }) => {
  const text = element.children[0]?.text;
  const { answers } = useSelector((state) => state.answer);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false); // 👈 new state
  const dragRef = useRef(null);

  const handleDragStart = (e) => {
    setIsDragging(true);

    // Custom drag image
    // const ghost = dragRef.current.cloneNode(true);
    // ghost.style.position = "absolute";
    // ghost.style.top = "-9999px";
    // ghost.style.opacity = "0.6";
    // ghost.style.backgroundColor = "#dbe9ff";
    // ghost.style.border = "2px dashed #1677FF";
    // ghost.style.cursor = "grabbing";
    // document.body.appendChild(ghost);
    // e.dataTransfer.setDragImage(ghost, 0, 0);

    e.dataTransfer.setData(
      "drag-item",
      JSON.stringify({
        id: element.id,
        value: text,
      })
    );

    // setTimeout(() => {
    //   document.body.removeChild(ghost);
    // }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsMouseDown(false);
  };

  const isUsed = answers.some((ans) => ans.value === text);

  return (
    <div
      ref={dragRef}
      draggable={!isUsed}
      onMouseDown={() => setIsMouseDown(true)} // 👈 real click detection
      onMouseUp={() => setIsMouseDown(false)} // 👈 reset on mouse up
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
      style={{
        padding: "4px 8px",
        width: "fit-content",
        borderRadius: "5px",
        backgroundColor: isDragging ? "#dbe9ff" : "#fff",
        cursor: isUsed ? "default" : "grab", // 👈 fix here
        fontSize: "14px",
        opacity: isDragging ? 0.7 : 1,
        marginBottom: "4px",
        userSelect: "none",
        fontWeight: "bold",
        textDecoration: isUsed ? "line-through" : "none",
        textDecorationColor: isUsed ? "#ff4d4f" : "none",
        border: isDragging ? "2px dashed #1677FF" : "1px solid #ddd",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {text}
    </div>
  );
};

export default DraggableHeading;
