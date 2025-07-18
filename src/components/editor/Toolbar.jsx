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
  Input,
  Popover,
  InputNumber,
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
  DropboxOutlined,
} from "@ant-design/icons";
import { insertTable, isFormatActive, toggleFormat } from "./editorUtils";
import { toast } from "react-toastify";

const Toolbar = ({ is_passage, startInputId = 0, insertImage }) => {
  const editor = useSlate();
  const [questionNumber, setQuestionNumber] = useState(0);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [row, setRow] = useState(1);
  const [columns, setColumns] = useState(1);

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);

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

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

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

  const handleCustomInsert = () => {
    insertTable(editor, customRows, customCols);
    setTableModalVisible(false);
  };

  const handleGridInsert = () => {
    insertTable(editor, row + 1, columns + 1);
    setPopoverVisible(false);
  };

  const content = (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${10}, 20px)`,
          gridTemplateRows: `repeat(${10}, 20px)`,
          gap: 5,
          padding: 5,
        }}
      >
        {[...Array(10)].map((_, r) =>
          [...Array(10)].map((_, c) => {
            const isHighlighted = r <= row && c <= columns;
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => {
                  setRow(r);
                  setColumns(c);
                }}
                onClick={handleGridInsert}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: isHighlighted ? "#1677ff" : "#f0f0f0",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                }}
              />
            );
          })
        )}
      </div>
      <div style={{ textAlign: "center", paddingTop: 4, fontSize: 12 }}>
        {row + 1} × {columns + 1}
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <Button
          type="link"
          onClick={() => {
            setPopoverVisible(false);
            setTableModalVisible(true);
          }}
        >
          Custom Table...
        </Button>
      </div>
    </div>
  );

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
        open={tableModalVisible}
        title="Insert Custom Table"
        onOk={handleCustomInsert}
        onCancel={() => setTableModalVisible(false)}
        okText="Insert"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            Rows:{" "}
            <InputNumber
              min={1}
              max={100}
              value={customRows}
              onChange={setCustomRows}
            />
          </div>
          <div>
            Columns:{" "}
            <InputNumber
              min={1}
              max={100}
              value={customCols}
              onChange={setCustomCols}
            />
          </div>
        </Space>
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
        <Popover
          content={content}
          open={popoverVisible}
          onOpenChange={setPopoverVisible}
          title="Insert Table"
          trigger="click"
        >
          <Button icon={<TableOutlined />} />
        </Popover>
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
        {/* <Tooltip title="Clear Area">
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Transforms.delete(editor, {
                at: [],
                match: () => true,
              });

              Transforms.insertNodes(editor, {
                type: "paragraph",
                children: [{ text: "" }],
              });
              const firstNodePath = Editor.start(editor, [0]);
              Transforms.select(editor, firstNodePath);
          
              editor.history = { undos: [], redos: [] };
            }}
          />
        </Tooltip> */}
      </Space>
    </>
  );
};

export default Toolbar;
