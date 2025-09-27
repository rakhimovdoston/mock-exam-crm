import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout, Spin, Splitter } from "antd";

import ExamHeader from "../../components/layouts/ExamHeader";
import ExamFooter from "../../components/layouts/ExamFooter";
import RichTextViewer from "../../components/editor/RichTextViewer";

import useApiRequest from "../../hooks/useApiRequest";
import useExamSecurity from "../../hooks/useExamSecurity";
import { initilalizeExam } from "../../store/examReducer";
import {
  getNumberByPassageType,
  getPassageNumberByPassageType,
  getQuestionNumbers,
  getQuestionNumbersForHeadins,
} from "../../utils";

const { Content } = Layout;

const ReadingExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectedPart, setSelectedPart] = useState(null);
  const { size } = useSelector((state) => state.app);

  const { data, loading, error } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=reading`
  );

  const examParts = data?.data || [];

  useExamSecurity();

  useEffect(() => {
    if (data && data.data) {
      setSelectedPart(data.data[0].type);
      dispatch(initilalizeExam(data.data));
    }
  }, [data]);

  if (loading) {
    return (
      <CenteredContainer>
        <Spin size="large" />
      </CenteredContainer>
    );
  }

  if (error || !examParts.length) {
    return (
      <CenteredContainer>
        <h2>Error loading exam data</h2>
      </CenteredContainer>
    );
  }

  const countListHeader = (content) => {
    let count = 0;
    for (const node of content) {
      if (node.type === "ordered-list" || node.type === "unordered-list") {
        count +=
          node.children?.filter((child) => child.type === "list-item").length ||
          0;
      }
    }
    return count;
  };

  return (
    <Layout
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ExamHeader type="reading" />
      <Content
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {examParts.map((part) => {
            return (
              <Splitter
                key={part.id}
                style={{
                  display: part.type == selectedPart ? "flex" : "none",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Splitter.Panel defaultSize="50%" min="40%" max="60%">
                  <div>
                    <h2 style={{ padding: "10px" }}>
                      Reading Passage{" "}
                      {getPassageNumberByPassageType(selectedPart)}
                    </h2>
                    <p
                      style={{
                        padding: "0 10px",
                        fontStyle: "italic",
                        fontSize: `${size}px`,
                        margin: 0,
                      }}
                    >
                      You should spend about 20 minutes on{" "}
                      <b>Questions {getNumberByPassageType(selectedPart)}</b>,
                      which are based on Reading Passage{" "}
                      {getPassageNumberByPassageType(selectedPart)} below.
                    </p>
                    <RichTextViewer
                      content={part.content}
                      type={""}
                      is_passage={true}
                      difficultType={part.type}
                    />
                  </div>
                </Splitter.Panel>
                <Splitter.Panel style={{ padding: "10px" }}>
                  {part.questions.map((question) => (
                    <div key={question.id}>
                      <p
                        style={{
                          fontSize: `${size}px`,
                          fontWeight: "bold",
                          color: "#1677ff",
                        }}
                      >
                        Questions{" "}
                        {question.type === "Matching Headings"
                          ? getQuestionNumbersForHeadins(
                              countListHeader(part.content),
                              part.type
                            )
                          : getQuestionNumbers(question)}
                      </p>
                      <RichTextViewer
                        headings={countListHeader(part.content)}
                        content={question.content}
                        type={question.type}
                      />
                    </div>
                  ))}
                </Splitter.Panel>
              </Splitter>
            );
          })}
        </div>
      </Content>
      <ExamFooter
        types={examParts.map((part) => part.type)}
        selectPart={selectedPart}
        setSelectPart={setSelectedPart}
      />
    </Layout>
  );
};

const CenteredContainer = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    {children}
  </div>
);

export default ReadingExam;
