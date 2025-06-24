import React, { useRef } from "react";
import { Transforms } from "slate";
import { ReactEditor, useSelected, useSlateStatic } from "slate-react";

export function ResizableTableCell({ attributes, element, children }) {
  const selected = useSelected();
  const editor = useSlateStatic();
  const cellRef = useRef(null);

  const width = element.width || 100;
  const height = element.height || 40;

  const startResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;

    const startWidth = width;
    const startHeight = height;

    const onMouseMove = (e) => {
      const path = ReactEditor.findPath(editor, element);

      if (direction === "right") {
        const newWidth = Math.max(100, startWidth + (e.clientX - startX));
        Transforms.setNodes(editor, { width: newWidth }, { at: path });
      }

      if (direction === "bottom") {
        const newHeight = Math.max(40, startHeight + (e.clientY - startY));
        Transforms.setNodes(editor, { height: newHeight }, { at: path });
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <td
      {...attributes}
      ref={cellRef}
      style={{
        position: "relative",
        width,
        height,
        minWidth: 60,
        minHeight: 30,
        border: selected ? "1px solid #08f" : `1px solid #ccc`,
        padding: 8,
        backgroundColor: selected ? "#f0f9ff" : undefined,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {children}
      <div
        onMouseDown={(e) => startResize(e, "right")}
        style={{
          position: "absolute",
          right: -3,
          top: 0,
          width: 6,
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
          backgroundColor: "transparent",
        }}
      />

      <div
        onMouseDown={(e) => startResize(e, "bottom")}
        style={{
          position: "absolute",
          bottom: -3,
          left: 0,
          height: 6,
          width: "100%",
          cursor: "row-resize",
          zIndex: 10,
          backgroundColor: "transparent",
        }}
      />
    </td>
  );
}
