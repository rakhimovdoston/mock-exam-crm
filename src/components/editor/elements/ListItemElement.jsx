import { Select } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Node, Transforms } from "slate";
import { ReactEditor, useSlateStatic } from "slate-react";
import { updateAnswer } from "../../../store/answerReducer";
import { getValueFromAnswer } from "../../../utils";
import { updateForUserAnswers } from "../../../store/examReducer";

const { Option } = Select;

const ListItemElement = ({ attributes, children, element }) => {
  const headingOptions = element.headingOptions || null;
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { answers } = useSelector((state) => state.answer);
  const userAnswers = useSelector((state) => state.exam);
  const dispatch = useDispatch();

  // Get the parent path (should be ordered-list or unordered-list)
  const parentPath = path.slice(0, -1);
  const parentNode = Node.get(editor, parentPath);

  let startNumber = 1;
  if (
    parentNode &&
    parentNode.type === "ordered-list" &&
    typeof parentNode.start === "number"
  ) {
    startNumber = parentNode.start;
  }

  const listItemIndex = path[path.length - 1];
  const itemNumber = startNumber + listItemIndex;
  const selectValue = getValueFromAnswer(itemNumber, answers);

  const getValue = () => {
    for (const anss of userAnswers.answers) {
      for (const ans of anss.answers) {
        if (ans.key === itemNumber) {
          return ans.value;
        }
      }
    }
    return "";
  };

  return (
    <li {...attributes}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div>{children}</div>
        {headingOptions &&
          headingOptions.length > 0 &&
          parentNode.listStyleType === "decimal" && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <strong>{element.label}</strong>
              <Select
                style={{ width: "130px" }}
                defaultValue={""}
                id={"ques-" + itemNumber}
                value={selectValue || element.headingMatch || getValue()}
                onChange={(e) => {
                  const path = ReactEditor.findPath(editor, element);
                  Transforms.setNodes(
                    editor,
                    { headingMatch: e },
                    { at: path }
                  );
                  if (answers.length > 0) {
                    dispatch(updateAnswer({ key: itemNumber, value: e })); // Update the answer in the store
                  } else {
                    dispatch(
                      updateForUserAnswers({ key: itemNumber, value: e })
                    );
                  }
                }}
              >
                <Option value="" disabled>
                  Select value:
                </Option>
                {headingOptions.map((opt) => (
                  <Option key={opt.key} value={opt.key}>
                    {opt.value}
                  </Option>
                ))}
              </Select>
            </div>
          )}
      </div>
    </li>
  );
};

export default ListItemElement;
