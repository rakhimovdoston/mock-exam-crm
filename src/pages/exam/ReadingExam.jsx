import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import { useDispatch } from "react-redux";
import { Layout, Spin } from "antd";
import ExamFooter from "../../components/layouts/ExamFooter";
import ExamHeader from "../../components/layouts/ExamHeader";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { getQuestionNumbers } from "../../utils";
import { initilalizeExam } from "../../store/examReducer";

const { Content } = Layout;

const ReadingExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectPart, setSelectPart] = useState();
  const [questions, setQuestions] = useState();
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=reading`
  );

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setSelectPart(data.data[0].type);
    }
  }, [data]);

  useEffect(() => {
    if (data && data.data && selectPart) {
      const filteredQuestions = data?.data?.filter(
        (question) => question.type === selectPart
      );
      setQuestions(filteredQuestions[0]);
      dispatch(initilalizeExam(data.data));
    }
  }, [data, selectPart]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Error loading exam data</h2>
      </div>
    );
  }

  return (
    <Layout style={{ position: "relative", height: "100vh" }}>
      <ExamHeader type={"reading"} />
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        {questions && (
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <RichTextViewer content={questions.content} />
            </div>
            <div style={{ flex: 1 }}>
              {questions.questions.map((question) => (
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
        types={data?.data?.map((ques) => ques.type)}
        selectPart={selectPart}
        setSelectPart={setSelectPart}
      />
    </Layout>
  );
};

export default ReadingExam;
