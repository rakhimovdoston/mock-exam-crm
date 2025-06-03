import { Editor, Node, Range, Transforms } from "slate";

export const isFormatActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export const toggleFormat = (editor, format) => {
  const isActive = isFormatActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const handleKeyDown = (editor, event) => {

  if (event.key === "Enter") {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [listItemNode] = Editor.nodes(editor, {
        match: (n) => n.type === "list-item",
      });

      if (listItemNode) {
        const [node] = listItemNode;
        if (Node.string(node).trim() === "") {
          event.preventDefault();
          Transforms.removeNodes(editor, {
            match: (n) => n.type === "list-item",
          });
          Transforms.insertNodes(editor, {
            type: "paragraph",
            children: [{ text: "" }],
          });
          return
        }
      }
    }
  }

  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case "b":
        event.preventDefault();
        toggleFormat(editor, "bold");
        break;
      case "i":
        event.preventDefault();
        toggleFormat(editor, "italic");
        break;
      case "u":
        event.preventDefault();
        toggleFormat(editor, "underline");
        break;
      default:
        break;
    }
  }

  if (event.key === "Tab") {
    event.preventDefault();
    Editor.insertText(editor, "\t");
  }
};