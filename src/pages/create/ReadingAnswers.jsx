import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spin, Result, Button, Divider, Layout, Typography, Flex } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import emptyCart from "../../assets/not_found.svg";
import { toast } from "react-toastify";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { useDispatch, useSelector } from "react-redux";
import { clearAnswers, updateAnswer } from "../../store/answerReducer";
import apiClient from "../../services/api";
import QuestionComponent from "../../components/questions/QuestionComponent";
import { getQuestionType } from "../../utils";
import { EditOutlined } from "@ant-design/icons";
import { DragProvider } from "../../components/editor/contexts/DragContext";

const ReadingAnswers = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [saveLoading, setSaveLoading] = useState(false);

  const navigate = useNavigate();
  const { answers } = useSelector((state) => state.answer);

  const { data, loading, error } = useApiRequest(
    `/api/v1/reading/passage/${id}`,
    [id]
  );

  if (loading) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin />
      </Layout>
    );
  }

  if (!data || error || data.code !== 200) {
    return (
      <Result
        subTitle={`No data found for this passage. ID: ${id}`}
        style={{ textAlign: "center", padding: "24px" }}
        icon={
          <img
            src={emptyCart}
            alt="No Data"
            style={{ width: "300px", height: "300px" }}
          />
        }
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />
    );
  }

  const countLists = () => {
    let count = 0;
    for (const node of data.data.content) {
      if (node.type === "ordered-list" || node.type === "unordered-list") {
        count +=
          node.children?.filter((child) => child.type === "list-item").length ||
          0;
      }
    }
    return count;
  };

  const savePassage = async () => {
    for (const answer of answers) {
      if (answer.value === "") {
        toast.error(`Please fill in all answers for question ${answer.key}`);
        return;
      }
    }

    const requestBody = {
      passageId: id,
      answers: answers,
    };
    setSaveLoading(true);
    try {
      const response = await apiClient.post(
        "api/v1/reading/answers",
        requestBody
      );
      if (response.code !== 200) {
        toast.error(response.message || "Failed to save passage");
        return;
      }
      dispatch(clearAnswers()); // Reset answers after saving
      toast.success("Passage saved successfully");
      navigate("/dashboard/ielts/reading");
    } catch (error) {
      console.error("Error saving passage:", error);
      toast.error(error.message || "An error occurred while saving passage");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Layout style={{ padding: "20px 10px", borderRadius: "10px" }}>
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          maxHeight: "calc(100vh - 250px)",
        }}
      >
        <Layout
          style={{
            flex: 1,
            width: "50%",
            borderRight: "1px solid #ddd",
            paddingRight: "20px",
            height: "100%",
            overflowY: "scroll",
          }}
        >
          <Flex justify="space-between" align="center">
            <Typography.Title level={4}>
              {getQuestionType(data?.data?.type)}
            </Typography.Title>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                navigate(`/dashboard/ielts/reading/${id}/update`);
              }}
            />
          </Flex>
          <RichTextViewer
            content={data.data.content}
            is_passage={true}
            difficultType={data?.data?.type}
          />
        </Layout>
        <div
          style={{
            flex: 1,
            width: "50%",
            overflowY: "scroll",
            paddingLeft: "20px",
          }}
        >
          <QuestionComponent
            type={"reading"}
            difficultType={data?.data?.type}
            countLists={countLists()}
          />
        </div>
      </div>
      <Divider />
      <div style={{ textAlign: "right" }}>
        <Button
          type="primary"
          onClick={savePassage}
          loading={saveLoading}
          disabled={saveLoading}
        >
          Save Passage
        </Button>
      </div>
    </Layout>
  );
};

export default ReadingAnswers;
