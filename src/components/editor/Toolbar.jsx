import React, { useState } from "react";
import {
  Transforms,
  Editor,
  Path,
  Node,
  Element as SlateElement,
  start,
} from "slate";
import { useSlate } from "slate-react";
import {
  Button,
  Space,
  Upload,
  Tooltip,
  Dropdown,
  Modal,
  Progress,
  Input,
} from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  TableOutlined,
  DeleteOutlined,
  UploadOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  FormOutlined,
  CheckSquareOutlined,
  PlusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { isFormatActive, toggleFormat } from "./editorUtils";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const Toolbar = ({ is_passage, startInputId = 0 }) => {
  const editor = useSlate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const insertTable = () => {
    const table = {
      type: "table",
      children: [
        {
          type: "table-row",
          children: [
            { type: "table-cell", children: [{ text: "" }] },
            { type: "table-cell", children: [{ text: "" }] },
          ],
        },
        {
          type: "table-row",
          children: [
            { type: "table-cell", children: [{ text: "" }] },
            { type: "table-cell", children: [{ text: "" }] },
          ],
        },
      ],
    };

    // Insert the table at the current selection
    Transforms.insertNodes(editor, table);

    // Get the path of the inserted table
    const [tableNodeEntry] = Editor.nodes(editor, {
      match: (node) => node.type === "table",
      mode: "lowest",
    });

    if (tableNodeEntry) {
      const [, tablePath] = tableNodeEntry;

      // Calculate the path after the table
      const nextPath = Path.next(tablePath);

      // Insert a new paragraph after the table
      const paragraph = {
        type: "paragraph",
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, paragraph, { at: nextPath });

      // Move the cursor to the new paragraph
      Transforms.select(editor, nextPath);
    }
  };

  // Remove the table from the editor
  const removeTable = () => {
    Transforms.removeNodes(editor, {
      match: (node) => node.type === "table",
    });
  };
  // Insert an image into the editor
  const insertImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "PHOTOS");
    try {
      const response = await apiClient.post("api/v1/file/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded / total) * 100);
          setUploadProgress(percentCompleted);
        },
      });

      const image = {
        type: "image",
        url: response.data.url,
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, image);
      Transforms.insertNodes(editor, {
        type: "paragraph",
        children: [{ text: "" }],
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false); // Hide the progress bar modal
      setUploadProgress(0); // Reset progress
    }
  };

  const setAlignment = (alignment) => {
    Transforms.setNodes(
      editor,
      { align: alignment },
      { match: (node) => Editor.isBlock(editor, node) }
    );
  };

  const getLastQuestionNumber = () => {
    let count = 0;
    for (const [node] of Node.elements(editor)) {
      if (
        !Editor.isEditor(node) &&
        SlateElement.isElement(node) &&
        node.type === "multiple-choice"
      ) {
        count++;
      }
    }
    return count;
  };

  const insertMultipleChoice = () => {
    const number = getLastQuestionNumber();

    const id = startInputId + number + 1;
    const multipleChoiceElement = {
      type: "multiple-choice",
      id: id,
      question: "",
      options: ["", "", ""],
      children: [{ text: "" }],
    };

    Transforms.insertNodes(editor, multipleChoiceElement);

    Transforms.insertNodes(editor, {
      type: "div",
      children: [{ text: "" }],
    });
  };

  const insertMultipleChoiceMultipleAns = () => {
    const element = {
      type: "multiple-choice-multiple-answer",
      questionNumber: questionNumber,
      startInputId: Number(startInputId) + 1,
      question: question,
      options: options,
      children: [{ text: "" }],
    };

    Transforms.insertNodes(editor, element);
  };

  const countInputElements = () => {
    let count = 0;
    for (const [node] of Node.elements(editor)) {
      if (
        !Editor.isEditor(node) &&
        SlateElement.isElement(node) &&
        node.type === "input"
      ) {
        count++;
      }
    }
    return count;
  };

  const insertInput = (type = "text") => {
    const inputCount = countInputElements();
    const input = {
      type: "input",
      inputType: type,
      value: "", // Initialize the value property
      placeholder: startInputId + inputCount + 1,
      children: [{ text: "" }], // Ensure the input has a valid text child
    };

    // Insert the input element
    Transforms.insertNodes(editor, input);

    // Get the path of the inserted input element
    const [inputNodeEntry] = Editor.nodes(editor, {
      match: (node) => node.type === "input",
      mode: "lowest",
    });

    if (inputNodeEntry) {
      const [, inputPath] = inputNodeEntry;

      // Calculate the path after the input element
      const nextPath = Path.next(inputPath);

      // Insert a span element after the input element
      const span = {
        type: "span",
        children: [{ text: "" }], // Add a space for inline separation
      };

      Transforms.insertNodes(editor, span, { at: nextPath });

      Transforms.select(editor, nextPath);
    }
  };

  const insertList = (type, listStyleType = "decimal") => {
    const list = {
      type: type,
      listStyleType: listStyleType,
      start: startInputId + 1,
      children: [
        {
          type: "list-item",
          children: [{ text: "" }],
        },
      ],
    };
    Transforms.insertNodes(editor, list);
  };

  const insertTableRow = () => {
    const [tableNodeEntry] = Editor.nodes(editor, {
      match: (node) => node.type === "table",
      mode: "lowest",
    });

    if (tableNodeEntry) {
      const [tableNode, tablePath] = tableNodeEntry;

      const lastRowIndex = tableNode.children.length - 1;

      const lastRowPath = [...tablePath, lastRowIndex];

      const cellCount = tableNode.children[lastRowIndex].children.length;

      // Create a new row with the same number of cells
      const newRow = {
        type: "table-row",
        children: Array.from({ length: cellCount }, () => ({
          type: "table-cell",
          children: [{ text: "" }],
        })),
      };

      // Insert the new row after the last row
      Transforms.insertNodes(editor, newRow, { at: Path.next(lastRowPath) });
    }
  };

  const insertTableCell = () => {
    const [tableRowEntry] = Editor.nodes(editor, {
      match: (node) => node.type === "table-row",
      mode: "lowest",
    });

    if (tableRowEntry) {
      const [rowNode, rowPath] = tableRowEntry;

      const newCell = {
        type: "table-cell",
        children: [{ text: "" }],
      };

      // Add new cell at the end of the row
      Transforms.insertNodes(editor, newCell, {
        at: [...rowPath, rowNode.children.length],
      });
    }
  };

  const removeTableRow = () => {
    Transforms.removeNodes(editor, {
      match: (node) => node.type === "table-row",
      mode: "lowest",
    });
  };

  // Remove a cell from the table
  const removeTableCell = () => {
    Transforms.removeNodes(editor, {
      match: (node) => node.type === "table-cell",
      mode: "lowest",
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const tableMenuItems = [
    {
      key: "insert-table",
      label: "Insert Table",
      onClick: () => insertTable(),
    },
    {
      key: "remove-table",
      label: "Delete Table",
      onClick: () => removeTable(),
    },
    {
      key: "insert-row",
      label: "Insert Table Row",
      onClick: () => insertTableRow(),
    },
    {
      key: "insert-cell",
      label: "Insert Table Cell",
      onClick: () => insertTableCell(),
    },
    {
      key: "remove-row",
      label: "Remove Table Row",
      onClick: () => removeTableRow(),
    },
    {
      key: "remove-cell",
      label: "Remove Table Cell",
      onClick: () => removeTableCell(),
    },
  ];

  const orderedListMenuItems = [
    {
      key: "decimal",
      label: "1, 2, 3",
      onClick: () => insertList("ordered-list", "decimal"),
    },
    {
      key: "upper-alpha",
      label: "A, B, C",
      onClick: () => insertList("ordered-list", "upper-alpha"),
    },
    {
      key: "lower-alpha",
      label: "a, b, c",
      onClick: () => insertList("ordered-list", "lower-alpha"),
    },
  ];

  const multipleChoiceItems = [
    {
      key: "multiple-choice-single-ansswer",
      label: "Multiple Choice (Single Answer)",
      onClick: () => insertMultipleChoice(),
    },
    {
      key: "multiple-choice-multiple-ansswer",
      label: "Multiple Choice (Multiple Answer)",
      onClick: () => setModalVisible(true),
    },
  ];

  return (
    <>
      <Modal
        title="Insert Listening Multiple Choice (Multiple Answer)"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => {
          if (questionNumber < 1 || questionNumber > 3) {
            toast.error("Please select a valid answer count (1-3).");
            return;
          }
          if (!question.trim()) {
            toast.error("Question cannot be empty.");
            return;
          }
          if (options.length <= questionNumber) {
            toast.error(`Please provide at more ${questionNumber} options.`);
            return;
          }
          for (const option of options) {
            if (!option.trim()) {
              toast.error("Options cannot be empty.");
              return;
            }
          }
          insertMultipleChoiceMultipleAns();
          setModalVisible(false);
          setQuestion("");
          setOptions([]);
          setQuestionNumber(0);
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            type="number"
            min={1}
            max={3}
            placeholder="Select answer count"
            value={questionNumber}
            onChange={(e) => setQuestionNumber(Number(e.target.value))}
          />
          <Input
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          {options.map((option, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <Input
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const updatedOptions = options.filter((_, i) => i !== index);
                  setOptions(updatedOptions);
                }}
              ></Button>
            </div>
          ))}
          <Button
            onClick={() => setOptions([...options, ""])}
            icon={<PlusOutlined />}
          >
            Add Option
          </Button>
        </Space>
      </Modal>
      <Modal
        open={uploading}
        footer={null}
        closable={false}
        centered
        title="Uploading Image..."
        style={{ textAlign: "center" }}
      >
        <Progress
          type="circle"
          percent={uploadProgress}
          status={uploadProgress == 100 ? "success" : "active"}
        />
      </Modal>

      <Space style={{ marginBottom: "10px" }} wrap>
        <Tooltip title="Bold (Ctrl+B)">
          <Button
            type={isFormatActive(editor, "bold") ? "primary" : "default"}
            icon={<BoldOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleFormat(editor, "bold");
            }}
          />
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <Button
            type={isFormatActive(editor, "italic") ? "primary" : "default"}
            icon={<ItalicOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleFormat(editor, "italic");
            }}
          />
        </Tooltip>
        <Tooltip title="Underline (Ctrl+U)">
          <Button
            type={isFormatActive(editor, "underline") ? "primary" : "default"}
            icon={<UnderlineOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleFormat(editor, "underline");
            }}
          />
        </Tooltip>
        <Tooltip title="Align Left">
          <Button
            icon={<AlignLeftOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              setAlignment("left");
            }}
          />
        </Tooltip>
        <Tooltip title="Align Center">
          <Button
            icon={<AlignCenterOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              setAlignment("center");
            }}
          />
        </Tooltip>
        <Tooltip title="Align Right">
          <Button
            icon={<AlignRightOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              setAlignment("right");
            }}
          />
        </Tooltip>
        {/* Dropdown for table-related actions */}
        <Dropdown menu={{ items: tableMenuItems }} trigger={["hover"]}>
          <Button icon={<TableOutlined />}></Button>
        </Dropdown>
        <Tooltip title="Upload Image">
          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={(file) => {
              insertImage(file);
              return false; // Prevent default upload behavior
            }}
          >
            <Button icon={<UploadOutlined />} />
          </Upload>
        </Tooltip>
        {!is_passage && (
          <Tooltip title="Insert Input">
            <Button
              icon={<FormOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                insertInput("text");
              }}
            />
          </Tooltip>
        )}
        {!is_passage && (
          <Dropdown menu={{ items: multipleChoiceItems }} trigger={["hover"]}>
            <Button icon={<CheckSquareOutlined />} />
          </Dropdown>
        )}
        <Dropdown menu={{ items: orderedListMenuItems }} trigger={["hover"]}>
          <Button icon={<OrderedListOutlined />}></Button>
        </Dropdown>
        <Tooltip title="Unordered List">
          <Button
            icon={<UnorderedListOutlined />}
            onMouseDown={(e) => {
              e.preventDefault();
              insertList("unordered-list");
            }}
          />
        </Tooltip>
      </Space>
    </>
  );
};

export default Toolbar;
