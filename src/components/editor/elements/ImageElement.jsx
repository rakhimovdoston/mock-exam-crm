import React from "react";

// This component renders an image element in the Slate editor
const ImageElement = ({ attributes, element }) => {
  return (
    <div {...attributes}>
      <img
        src={element.url}
        alt="Editor content"
        style={{ maxWidth: "100%", display: "block", padding: "10px",
          width: "auto",
          height: "500px"
          }}
      />
    </div>
  );
};

export default ImageElement;
