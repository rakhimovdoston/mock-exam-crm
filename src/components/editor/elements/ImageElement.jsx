import React from "react";

// This component renders an image element in the Slate editor
const ImageElement = ({ attributes, element, children }) => {
  return (
    <div {...attributes}>
      <img
        src={element.url}
        alt="Editor content"
        style={{ maxWidth: "100%", display: "block", padding: "10px",
          width: "500px",
          height: "auto"
          }}
      />
    </div>
  );
};

export default ImageElement;
