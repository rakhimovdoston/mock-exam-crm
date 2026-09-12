import React from "react";
import { useSelector } from "react-redux";

// #RGB / #RRGGBB -> rgba(). Highlight colours come from the saved document, so
// they are plain hex strings written when the question was authored.
const withAlpha = (hex, alpha) => {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;

  const value =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join("")
      : hex.slice(1);

  if (value.length !== 6) return hex;

  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return hex;

  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
};

const Leaf = ({ attributes, children, leaf }) => {
  const isDark = useSelector((state) => state.app.theme) === "dark";
  const isHighlighted = leaf.highlight && leaf.highlight !== "transparent";

  // In night mode a solid pastel marker is a glaring patch on a dark page, so
  // it becomes a translucent wash and the text keeps its normal light colour.
  // In day mode the marker stays solid and the text switches to dark ink.
  const background = isHighlighted
    ? isDark
      ? withAlpha(leaf.highlight, 0.28)
      : leaf.highlight
    : "transparent";

  return (
    <span
      {...attributes}
      style={{
        fontWeight: leaf.bold ? "bold" : "normal",
        fontStyle: leaf.italic ? "italic" : "normal",
        textDecoration: leaf.underline ? "underline" : "none",
        backgroundColor: background,
        color: isHighlighted && !isDark ? "#101828" : undefined,
        borderRadius: isHighlighted ? 3 : undefined,
        padding: isHighlighted ? "0 1px" : undefined,
      }}
    >
      {children}
    </span>
  );
};

export default Leaf;
