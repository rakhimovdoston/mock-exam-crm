import {
  Editor,
  Element as SlateElement,
  Node,
  Path,
  Range,
  Transforms,
} from "slate";
import { ReactEditor } from "slate-react";

export const isFormatActive = (editor, format, value = "") => {
  const marks = Editor.marks(editor);
  if (format === "highlight") {
    return marks ? marks[format] === value : false;
  }
  return marks ? marks[format] === true : false;
};

export const toggleFormat = (editor, format, value = "") => {
  const isActive = isFormatActive(editor, format, value);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, value === "" ? true : value);
  }
};

export const insertTable = (editor, rows = 2, cols = 2) => {
  const table = {
    type: "table",
    children: Array.from({ length: rows }).map(() => ({
      type: "table-row",
      children: Array.from({ length: cols }).map(() => ({
        type: "table-cell",
        width: 100,
        height: 40,
        children: [{ text: "" }],
      })),
    })),
  };

  Transforms.insertNodes(editor, table);
  const [tableNodeEntry] = Editor.nodes(editor, {
    match: (node) => node.type === "table",
    mode: "lowest",
  });

  if (tableNodeEntry) {
    const [, tablePath] = tableNodeEntry;

    const nextPath = Path.next(tablePath);

    const paragraph = {
      type: "paragraph",
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, paragraph, { at: nextPath });

    Transforms.select(editor, nextPath);
  }
};

export const removeTable = (editor) => {
  Transforms.removeNodes(editor, {
    match: (node) => node.type === "table",
  });
};

export const handleKeyDown = (editor, event) => {
  if (event.key === "Enter") {
    const { selection } = editor;

    const [listItemNode] = Editor.nodes(editor, {
      match: (n) => SlateElement.isElement(n) && n.type === "list-item",
    });

    if (listItemNode) {
      const [node] = listItemNode;
      if (Node.string(node).trim() === "") {
        event.preventDefault();
        Transforms.unwrapNodes(editor, {
          match: (n) =>
            SlateElement.isElement(n) &&
            (n.type === "ordered-list" || n.type === "unordered-list"),
          split: true,
        });
        Transforms.insertNodes(editor, {
          type: "paragraph",
          children: [{ text: "" }],
        });
        return;
      }
      return;
    }

    if (selection && Range.isCollapsed(selection)) {
      const [tableCell] = Editor.node(editor, {
        match: (n) => SlateElement.isElement(n) && n.type === "table-cell",
      });

      if (tableCell) {
        event.preventDefault();
        Editor.insertText(editor, "\n");
        return;
      }
      return;
    }
  }

  if (event.key === "Backspace") {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [listItemEntry] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) && n.type === "list-item",
      });
      if (listItemEntry) {
        const [listItemNode, listItemPath] = listItemEntry;
        const listItemText = Node.string(listItemNode).trim();

        if (listItemText === "") {
          event.preventDefault();

          Transforms.removeNodes(editor, { at: listItemPath });

          const [parentList] = Editor.parent(editor, listItemPath);
          const parentListNode = parentList[0];

          if (
            SlateElement.isElement(parentListNode) &&
            (parentListNode.type === "ul" || parentListNode.type === "ol") &&
            parentListNode.children.length === 1
          ) {
            Transforms.removeNodes(editor, {
              at: Editor.parent(editor, listItemPath)[1],
            });
          }
          return;
        }
        return;
      }

      const [tableCell] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) && n.type === "table-cell",
      });
      if (tableCell) {
        const [cellNode] = tableCell;
        const cellText = Node.string(cellNode).trim();
        if (cellText === "") {
          event.preventDefault();
          return;
        }
        return;
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
      case "a":
        const { selection } = editor;

        if (selection && Range.isCollapsed(selection)) {
          const [cellEntry] = Editor.nodes(editor, {
            match: (n) => SlateElement.isElement(n) && n.type === "table-cell",
          });

          if (cellEntry) {
            event.preventDefault(); // Slate'ning default Ctrl+A'sini bloklaymiz
            const [, cellPath] = cellEntry;

            // Shu cell ichidagi barcha textni tanlaymiz
            const cellRange = Editor.range(editor, cellPath);
            Transforms.select(editor, cellRange);
          }
        }
        break;

      default:
        break;
    }
  }

  if (event.key === "Tab") {
    const [tableCell] = Editor.nodes(editor, {
      match: (n) => SlateElement.isElement(n) && n.type === "table-cell",
    });

    if (tableCell) {
      const [cellNode, cellPath] = tableCell;
      const tablePath = cellPath.slice(0, -2);
      const rowIndex = cellPath[cellPath.length - 2];
      const colIndex = cellPath[cellPath.length - 1];
      const tableNode = Editor.node(editor, tablePath)[0];
      const rows = tableNode.children;
      let targetPath;

      if (!event.shiftKey) {
        if (colIndex < rows[rowIndex].children.length - 1) {
          targetPath = [...tablePath, rowIndex, colIndex - 1];
        } else if (rowIndex < rows.length - 1) {
          targetPath = [...tablePath, rowIndex + 1, 0];
        }
      } else {
        if (colIndex > 0) {
          targetPath = [...tablePath, rowIndex, colIndex - 1];
        } else if (rowIndex > 0) {
          const prevRow = rows[rowIndex - 1];
          targetPath = [
            ...tablePath,
            rowIndex - 1,
            prevRow.children.length - 1,
          ];
        }
      }
      if (targetPath) {
        event.preventDefault();
        Transforms.select(editor, Editor.start(editor, tablePath));
        ReactEditor.focus(editor);
      }
      return;
    }

    event.preventDefault();
    Editor.insertText(editor, "\t");
  }
};
