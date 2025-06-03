import React from "react";

// This component renders an image element in the Slate editor
const ImageElement = ({ attributes, element }) => {
  return (
    <div {...attributes}>
      <img
        src={element.url}
        alt="Editor content"
        style={{ maxWidth: "100%", display: "block", margin: "10px 0" }}
      />
    </div>
  );
};

export default ImageElement;
