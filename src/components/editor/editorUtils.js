import {
  Editor,
  Element as SlateElement,
  Node,
  Path,
  Range,
  Text,
  Transforms,
} from "slate";
import { ReactEditor } from "slate-react";

/**
 * Is `format` applied at the selection?
 *
 * Boolean marks (bold/italic/underline) store `true`, but a highlight stores a
 * colour string — comparing against `true` made highlights read as never
 * active, so they could never be toggled back off.
 * Passing `value` narrows the check to that exact value, which is what lets the
 * same colour act as a toggle while a different colour replaces it.
 */
export const isFormatActive = (editor, format, value) => {
  const marks = Editor.marks(editor);
  if (!marks) return false;

  const current = marks[format];
  if (current === undefined || current === false) return false;

  return value === undefined || value === "" ? true : current === value;
};

export const toggleFormat = (editor, format, value = "") => {
  if (isFormatActive(editor, format, value)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, value === "" ? true : value);
  }
};

/** Drop a mark from the selection entirely, whatever its value is. */
export const clearFormat = (editor, format) => {
  Editor.removeMark(editor, format);
};

/**
 * The range covering every text node whose `format` mark equals `value`.
 *
 * A mark is stored per leaf, so a note written over a phrase becomes several
 * text nodes sharing one id — and the candidate only ever clicks one of them.
 * Editing, deleting or scrolling to that note has to act on the run as a whole,
 * and the id is what identifies it. Returns null when nothing carries the mark.
 */
export const getMarkRangeByValue = (editor, format, value) => {
  const leaves = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (node) => Text.isText(node) && node[format] === value,
    })
  );

  if (!leaves.length) return null;

  const [, firstPath] = leaves[0];
  const [lastNode, lastPath] = leaves[leaves.length - 1];

  return {
    anchor: { path: firstPath, offset: 0 },
    focus: { path: lastPath, offset: lastNode.text.length },
  };
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

export const canDragAndDrop = (content, type) => {
  if (type === "Matching Sentence Endings" || type === "Summary Completion") {
    return content.some((node) => {
      if (node.type === "unordered-list") {
        return true;
      }
      if (node.children) {
        return canDragAndDrop(node.children, type);
      }
      return false;
    });
  }
  return false;
};
