import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Layout, Result, Spin, Splitter } from "antd";

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
import "../../styles/exam.css";

const { Content } = Layout;

// How far, in % of the pane width, a part slides aside when it is not open.
const PANE_TRAVEL = 55;

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
        <Result
          status="warning"
          title="We could not load this section"
          subTitle="Please refresh the page. If the problem continues, call your invigilator."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      </CenteredContainer>
    );
  }

  // Position in the filmstrip that every pane is offset against.
  const activeIndex = Math.max(
    examParts.findIndex((part) => part.type === selectedPart),
    0
  );

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
        className="exam-body"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="exam-panes">
          {examParts.map((part, index) => {
            const isActive = part.type == selectedPart;
            // Panes travel a fraction of the full width, which reads as a
            // gentle parallax rather than a hard filmstrip snap.
            const offset = (index - activeIndex) * PANE_TRAVEL;

            return (
              <div
                key={part.id}
                className={`exam-pane${isActive ? " exam-pane--active" : ""}`}
                style={{
                  transform: `translateX(${offset}%) scale(${
                    isActive ? 1 : 0.985
                  })`,
                }}
              >
                <Splitter style={{ height: "100%", background: "var(--exam-bg)" }}>
                <Splitter.Panel defaultSize="50%" min="40%" max="60%">
                  <div className="exam-split-panel">
                    <h2 className="exam-passage-title">
                      Reading Passage{" "}
                      {getPassageNumberByPassageType(selectedPart)}
                    </h2>
                    <p
                      className="exam-passage-note"
                      style={{ fontSize: `${size}px` }}
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
                <Splitter.Panel>
                  <div className="exam-split-panel">
                    {part.questions.map((question) => (
                      <div
                        key={question.id}
                        className="exam-panel"
                        style={{ padding: "16px 18px", marginBottom: 16 }}
                      >
                        <h2 className="exam-section-title">
                          Questions{" "}
                          {question.type === "Matching Headings"
                            ? getQuestionNumbersForHeadins(
                                countListHeader(part.content),
                                part.type
                              )
                            : getQuestionNumbers(question)}
                        </h2>
                        <RichTextViewer
                          headings={countListHeader(part.content)}
                          content={question.content}
                          type={question.type}
                        />
                      </div>
                    ))}
                  </div>
                </Splitter.Panel>
                </Splitter>
              </div>
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
