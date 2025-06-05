import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Layout, Spin } from "antd";

import ExamHeader from "../../components/layouts/ExamHeader";
import ExamFooter from "../../components/layouts/ExamFooter";
import RichTextViewer from "../../components/editor/RichTextViewer";

import useApiRequest from "../../hooks/useApiRequest";
import { initilalizeExam } from "../../store/examReducer";
import { getQuestionNumbers } from "../../utils";

const { Content } = Layout;

const ReadingExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectedPart, setSelectedPart] = useState(null);

  const { data, loading, error } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=reading`
  );

  const examParts = data?.data || [];

  useEffect(() => {
    if (examParts.length) {
      setSelectedPart(examParts[0].type); // default to first part
      dispatch(initilalizeExam(examParts));
    }
  }, [examParts]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const currentPart = useMemo(() => {
    return examParts.find((part) => part.type === selectedPart);
  }, [examParts, selectedPart]);

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

  return (
    <Layout style={{ position: "relative", height: "100vh" }}>
      <ExamHeader type="reading" />
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        {currentPart && (
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <RichTextViewer content={currentPart.content} type={""} />
            </div>
            <div style={{ flex: 1 }}>
              {currentPart.questions.map((question) => (
                <div key={question.id}>
                  <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                    Questions {getQuestionNumbers(question)}
                  </p>
                  <RichTextViewer
                    content={question.content}
                    type={question.type}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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
