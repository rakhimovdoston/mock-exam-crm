import React, { useState } from "react";
import { Radio, Card } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswer } from "../../../store/answerReducer";
import { getValueFromAnswer } from "../../../utils";

const ReadOnlyMultipleChoiceElement = ({ element }) => {
  const [selected, setSelected] = useState(null);
  const dispatch = useDispatch();
  const {answers} = useSelector((state) => state.answer);

  const value = getValueFromAnswer(element.id, answers);

  return (
    <Card
      id={"ques-" + element.id}
      size="small"
      style={{
        padding: "10px",
        borderRadius: "8px",
        backgroundColor: "#fffefc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{fontWeight: 500, fontSize: "16px"}}>{element.id}.</span>
        <span style={{ fontWeight: "bold", fontSize: "18px" }}>{element.question}</span>
      </div>
      <Radio.Group
        onChange={(e) => {
          setSelected(e.target.value);
          dispatch(updateAnswer({ key: element.id, value: e.target.value }));
        }}
        value={value || selected}
        style={{ display: "flex", flexDirection: "column", gap: "6px" }}
      >
        {element.options.map((opt, idx) => (
          <Radio key={idx} value={opt}>
            <span style={{ fontWeight: 500 }}>
              {String.fromCharCode(65 + idx)}.
            </span>{" "}
            {opt}
          </Radio>
        ))}
      </Radio.Group>
    </Card>
  );
};

export default ReadOnlyMultipleChoiceElement;
