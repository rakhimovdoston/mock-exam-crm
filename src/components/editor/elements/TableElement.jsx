import React, { useEffect, useRef, useState } from "react";
import { Node, Transforms } from "slate";
import { ReactEditor, useSlateStatic } from "slate-react";
import {
  InsertRowBelowOutlined,
  DeleteOutlined,
  InsertRowRightOutlined,
  DeleteRowOutlined,
  DeleteColumnOutlined
} from "@ant-design/icons";
import { Menu } from "antd";

const TableElement = ({ attributes, children, element }) => {
  const tableRef = useRef(null);
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const [hoveredButton, setHoveredButton] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const editor = useSlateStatic();

  useEffect(() => {
    if (tableRef.current) {
      const { offsetWidth, offsetHeight } = tableRef.current;
      setTableSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [children]);

  const addColumn = () => {
    const tablePath = ReactEditor.findPath(editor, element);
    const tableNode = Node.get(editor, tablePath);
    const newWidth = "100px";

    const columnWidths = [...(element.columnWidths || []), newWidth];
    Transforms.setNodes(editor, { columnWidths }, { at: tablePath });

    tableNode.children.forEach((row, rowIndex) => {
      const cellPath = [...tablePath, rowIndex, row.children.length];
      const newCell = {
        type: "table-cell",
        width: 100,
        height: 40,
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, newCell, { at: cellPath });
    });
  };

  const addRow = () => {
    const tablePath = ReactEditor.findPath(editor, element);
    const tableNode = Node.get(editor, tablePath);

    const firstRow = tableNode.children[0];
    const columnCount = firstRow?.children?.length || 1;

    const newRow = {
      type: "table-row",
      children: Array.from({ length: columnCount }, () => ({
        type: "table-cell",
        width: 100,
        height: 40,
        children: [{ text: "" }],
      })),
    };

    Transforms.insertNodes(editor, newRow, {
      at: [...tablePath, tableNode.children.length],
    });
  };

  const getRowIndexFromEvent = (event) => {
    const trElement = event.target.closest("tr");
    if (!trElement) return null;

    const tbody = trElement.parentElement;
    if (!tbody) return null;

    const rows = Array.from(tbody.children);
    const rowIndex = rows.indexOf(trElement);

    return rowIndex !== -1 ? rowIndex : null;
  };

  const getColIndexFromEvent = (event) => {
    const tdElement = event.target.closest("td");
    if (!tdElement) return null;

    const trElement = tdElement.parentElement;
    if (!trElement) return null;

    const cells = Array.from(trElement.children);
    const colIndex = cells.indexOf(tdElement);

    return colIndex !== -1 ? colIndex : null;
  };

  const removeTable = () => {
    const tablePath = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: tablePath });
  };

  const handleDeleteRow = () => {
    const tablePath = ReactEditor.findPath(editor, element);
    const tableNode = Node.get(editor, tablePath);

    if (contextMenu?.rowIndex != null) {
      const rowPath = [...tablePath, contextMenu.rowIndex];

      if (tableNode.children.length > 1) {
        Transforms.removeNodes(editor, { at: rowPath });
      } else {
        Transforms.removeNodes(editor, { at: tablePath });
      }

      setContextMenu(null);
    }
  };

  const handleDeleteColumn = () => {
    const tablePath = ReactEditor.findPath(editor, element);
    const tableNode = Node.get(editor, tablePath);

    if (contextMenu?.colIndex != null) {
      const colIndex = contextMenu.colIndex;

      const updatedRows = tableNode.children.map((row, rowIndex) => {
        if (row.children.length <= 1) {
          Transforms.removeNodes(editor, { at: tablePath });
          return;
        }

        const cellPath = [...tablePath, rowIndex, colIndex];
        Transforms.removeNodes(editor, { at: cellPath });
      });

      setContextMenu(null); // menyuni yopish
    }
  };

  const menuItems = [
    {
      key: "addRow",
      label: "Add Row",
      icon: <InsertRowBelowOutlined />,
      onClick: addRow,
    },
    {
      key: "addColumn",
      label: "Add Column",
      icon: <InsertRowRightOutlined />,
      onClick: addColumn,
    },
    {
      key: "removeRow",
      label: "Remove Row",
      icon: <DeleteColumnOutlined />,
      onClick: handleDeleteRow,
      danger: true,
    },
    {
      key: "removeColumn",
      label: "Remove Column",
      icon: <DeleteRowOutlined />,
      onClick: handleDeleteColumn,
      danger: true,
    },
    {
      key: "removeTable",
      label: "Remove Table",
      icon: <DeleteOutlined />,
      onClick: removeTable,
      danger: true,
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      {contextMenu && (
        <Menu
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            fontSize: "12px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            zIndex: 999,
          }}
          onMouseLeave={() => setContextMenu(null)}
          items={menuItems}
        />
      )}
      <table
        ref={tableRef}
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = tableRef.current.getBoundingClientRect();
          setContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            rowIndex: getRowIndexFromEvent(e),
            colIndex: getColIndexFromEvent(e),
          });
        }}
        style={{
          borderCollapse: "collapse",
          tableLayout: "fixed",
          width: "100%",
          backgroundColor: "transparent",
          transition: "background-color 0.3s ease",
        }}
      >
        <tbody {...attributes}>{children}</tbody>
      </table>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: tableSize.width,
          width: 24,
          height: tableSize.height,
          backgroundColor:
            hoveredButton === "addColumn" ? "#e6f7ff" : "#f0f0f0", // Change background on hover
          color: hoveredButton === "addColumn" ? "#389e0d" : "black", // Change text color on hover
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "1px solid #ccc",
          borderTopRightRadius: "5px",
          borderBottomRightRadius: "5px",
          zIndex: 5,
          transition: "background-color 0.3s, color 0.3s",
        }}
        onClick={addColumn}
        onMouseEnter={() => setHoveredButton("addColumn")}
        onMouseLeave={() => setHoveredButton(null)}
        title="Add column"
      >
        +
      </div>

      <div
        style={{
          position: "absolute",
          top: tableSize.height,
          left: 0,
          height: 24,
          width: tableSize.width,
          backgroundColor: hoveredButton === "addRow" ? "#e6f7ff" : "#f0f0f0", // Change background on hover
          color: hoveredButton === "addRow" ? "#389e0d" : "black", // Change text color on hover
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "1px solid #ccc",
          borderBottomRightRadius: "5px",
          borderBottomLeftRadius: "5px",
          zIndex: 5,
          transition: "background-color 0.3s, color 0.3s",
        }}
        onClick={addRow}
        onMouseEnter={() => setHoveredButton("addRow")}
        onMouseLeave={() => setHoveredButton(null)}
        title="Add row"
      >
        +
      </div>
    </div>
  );
};

export default TableElement;
