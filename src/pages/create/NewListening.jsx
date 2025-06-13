import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest"; // Adjust the import path as necessary
import {
  Button,
  Divider,
  Layout,
  Select,
  Skeleton,
  Spin,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import RichTextViewer from "../../components/editor/RichTextViewer";
import QuestionModal from "../../components/modal/QuestionModal";
import {
  getInitValue,
  getLastQuestionId,
  getQuestionNumbers,
  getStartByQuestionType,
  getTitle,
} from "../../utils";
import { listening_inits } from "../../data/listening";
import { setQuestionType } from "../../store/questionReducer";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAnswers,
  initializeAnswers,
  setAnswers,
} from "../../store/answerReducer";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import DeleteModal from "../../components/modal/DeleteModal";
import QuestionComponent from "../../components/questions/QuestionComponent";

const { Option } = Select;

const NewListening = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectQuestionType, setSelectQuestionType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [initKeys, setInitKeys] = useState([]);
  const [isRefresh, setRefresh] = useState(false);
  const [isDelete, setDelete] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const { answers } = useSelector((state) => state.answer);

  const { data, loading, error } = useApiRequest(`api/v1/listening/get/${id}`);
  const questions = useApiRequest(`/api/v1/listening/${id}/get`, [
    id,
    isRefresh,
  ]);

  useEffect(() => {
    if (questions.data && questions.data.data?.questions) {
      const multiAnswerKeys = questions.data.data.questions
        .filter((q) => q.type === "Multiple Choice (Multiple answers)")
        .map(getQuestionNumbers);
      setInitKeys([...new Set(multiAnswerKeys)]);
    }
  }, [questions.data]);

  useEffect(() => {
    if (questions.data && questions.data.data) {
      const questionsAnswers = questions.data.data.answers;
      if (questionsAnswers && questionsAnswers.length > 0) {
        dispatch(setAnswers(questionsAnswers));
        return;
      }

      const lastQuestionId = getLastQuestionId(questions.data?.data.questions);
      if (lastQuestionId > 0) {
        dispatch(
          initializeAnswers({
            numberOfAnswers: lastQuestionId,
            startNumber:
              getStartByQuestionType(data?.data?.type, "LISTENING") + 1,
            initKeys: initKeys,
          })
        );
      }
    }
  }, [questions.data, data?.data?.type, initKeys]);

  if (loading)
    return (
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%", // Nested height
        }}
      >
        <Spin tip="Loading..." />
      </Layout>
    );
  if (!data | error)
    return (
      <Typography.Text type="danger">Error: {error?.message}</Typography.Text>
    );

  const getStart = () => {
    const lastQuestionNumber = getLastQuestionId(
      questions.data?.data?.questions
    );
    const startByQuestionType = getStartByQuestionType(
      data?.data?.type,
      "LISTENING"
    );
    let start = 0;
    if (lastQuestionNumber > 0) {
      start = lastQuestionNumber;
    } else {
      start = startByQuestionType + lastQuestionNumber;
    }
    return start;
  };

  const saveListening = async () => {
    for (const answer of answers) {
      if (answer?.value === "" || answer?.options?.length === 0) {
        toast.error(
          `Please fill in all answers for question ${
            answer?.value === "" ? answer.key : answer.keys
          }`
        );
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
        "api/v1/listening/answers",
        requestBody
      );
      if (response.code !== 200) {
        toast.error(response.message || "Failed to save passage");
        return;
      }
      dispatch(clearAnswers());
      toast.success("Passage saved successfully");
      navigate("/dashboard/ielts/listening");
    } catch (error) {
      console.error("Error saving passage:", error);
      toast.error(error.message || "An error occurred while saving passage");
    } finally {
      setSaveLoading(false);
    }
  };

  const questioNumber = (question) => {
    return getQuestionNumbers(question);
  };

  return (
    <Layout
      style={{
        padding: "0 20px",
        maxHeight: "calc(100vh-250px)",
        borderRadius: "8px",
      }}
    >
      {data && (
        <div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography.Title level={2}>{data.data.title}</Typography.Title>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Typography.Text>Select Listening part.</Typography.Text>
              <Select
                defaultValue={data.data.type}
                onChange={(e) => setType(e)}
                style={{ width: 200 }}
              >
                <Option value="all">All</Option>
                <Option value="part_1">Listening Part 1</Option>
                <Option value="part_2">Listening Part 2</Option>
                <Option value="part_3">Listening Part 3</Option>
                <Option value="part_4">Listening Part 4</Option>
              </Select>
            </div>
          </div>
          <audio
            controls
            controlsList="nodownload noplaybackrate"
            style={{ width: "100%" }}
          >
            <source src={data.data.audio} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <Divider />
        </div>
      )}
      <div
        style={{
          overflowY: "scroll",
          paddingLeft: "20px",
        }}
      >
        <QuestionComponent difficultType={data?.data?.type} type={'listening'} />
      </div>
      <div style={{ textAlign: "right", padding: "20px 0" }}>
        <Button
          type="primary"
          onClick={saveListening}
          loading={saveLoading}
          disabled={saveLoading}
        >
          Save Passage
        </Button>
      </div>
    </Layout>
  );
};

export default NewListening;
