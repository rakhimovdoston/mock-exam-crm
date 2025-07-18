import { Radio, Select } from "antd";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Node, Transforms } from "slate";
import { ReactEditor, useSlateStatic } from "slate-react";
import { updateAnswer } from "../../../../store/answerReducer";
import { getValueFromAnswer } from "../../../../utils";
import { updateForUserAnswers } from "../../../../store/examReducer";
import ListItemViewDragAndDropElement from "./ListItemViewDragAndDropElement";

const { Option } = Select;

const ListItemViewElement = ({
  attributes,
  children,
  element,
  view = true,
  is_passage,
  index,
  startQuestionNumber,
  dragAndDrop = false,
}) => {
  const headingOptions = element.headingOptions || null;
  const questionType = element.questionsType || null;
  const [selected, setSelected] = useState(null);
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { answers } = useSelector((state) => state.answer);
  const userAnswers = useSelector((state) => state.exam);
  const dispatch = useDispatch();

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

  const checkedValue = () => {
    for (const ans of userAnswers.answers) {
      for (const a of ans.answers) {
        if (a.key === element.id) {
          return a.value;
        }
      }
    }
    return "";
  };

  const isModernMatching =
    questionType &&
    (questionType === "Matching Information" ||
      questionType === "Matching Features");

  const checkQuestionTypes =
    questionType &&
    (questionType === "Yes/No/Not Given" ||
      questionType === "True/False/Not Given");

  if ((is_passage && parentNode.type === 'unordered-list' || questionType === "Matching Headings") || dragAndDrop) {    
    return (
      <ListItemViewDragAndDropElement
        attributes={attributes}
        element={element}
        children={children}
        index={index}
        startNumber={startQuestionNumber}
        is_passage={is_passage}
      />
    );
  }

  if (parentNode.listStyleType === "decimal" && isModernMatching) {
    return (
      <tr {...attributes}>
        <td
          style={{
            padding: "8px",
            verticalAlign: "top",
            minWidth: "250px",
            border: "1px solid #ccc",
          }}
        >
          <strong>{itemNumber}.</strong> {children}
        </td>
        {headingOptions.map((opt) => (
          <td
            key={opt.key}
            style={{
              textAlign: "center",
              width: "100%",
              cursor: "pointer",
              height: "auto",
              transition: "background-color 0.2s ease-in-out",
              border: "1px solid #ccc",
            }}
            onClick={() => {
              setSelected(opt.key);
              const payload = { key: itemNumber, value: opt.key };
              if (answers.length > 0) {
                dispatch(updateAnswer(payload));
              } else {
                dispatch(updateForUserAnswers(payload));
              }
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f8ff")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <Radio
              checked={
                (selectValue || selected || checkedValue() || getValue()) ===
                opt.key
              }
            />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <li {...attributes}>
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: checkQuestionTypes ? undefined : "center",
          flexDirection: checkQuestionTypes ? "column" : "row",
          justifyContent: view ? "space-between" : undefined,
          marginBottom: "10px",
          gap: 10,
        }}
      >
        {children}
        {headingOptions &&
          headingOptions.length > 0 &&
          parentNode.listStyleType === "decimal" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* <strong>{element.label}</strong> */}
              {parentNode.listStyleType === "decimal" && checkQuestionTypes ? (
                <Radio.Group
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  value={selectValue || selected || checkedValue()}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    if (answers.length > 0) {
                      dispatch(
                        updateAnswer({ key: itemNumber, value: e.target.value })
                      );
                    } else {
                      dispatch(
                        updateForUserAnswers({
                          key: itemNumber,
                          value: e.target.value,
                        })
                      );
                    }
                  }}
                >
                  {headingOptions.map((opt) => (
                    <Radio
                      key={opt.key}
                      value={opt.key}
                      style={{ fontWeight: 500 }}
                    >
                      {opt.value.toUpperCase()}
                    </Radio>
                  ))}
                </Radio.Group>
              ) : questionType === "Matching Headings" ? (
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
                      dispatch(updateAnswer({ key: itemNumber, value: e }));
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
              ) : (
                <Radio.Group
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px",
                    width: "100%",
                  }}
                  value={
                    selectValue || selected || checkedValue() || getValue()
                  }
                  onChange={(e) => {
                    setSelected(e.target.value);
                    if (answers.length > 0) {
                      dispatch(
                        updateAnswer({ key: itemNumber, value: e.target.value })
                      );
                    } else {
                      dispatch(
                        updateForUserAnswers({
                          key: itemNumber,
                          value: e.target.value,
                        })
                      );
                    }
                  }}
                >
                  {headingOptions.map((opt) => (
                    <Radio
                      key={opt.key}
                      value={opt.key}
                      style={{
                        fontWeight: 500,
                        justifySelf: "center",
                      }}
                    ></Radio>
                  ))}
                </Radio.Group>
              )}
            </div>
          )}
      </div>
    </li>
  );
};

export default ListItemViewElement;
