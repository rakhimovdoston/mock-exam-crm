import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Spin,
  Result,
  Button,
  Typography,
  Divider,
  Layout,
  Select,
  Skeleton,
} from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import emptyCart from "../../assets/not_found.svg";
import QuestionModal from "../../components/modal/QuestionModal";
import { toast } from "react-toastify";
import { readings_inits } from "../../data/reading";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { useDispatch, useSelector } from "react-redux";
import { setQuestionType } from "../../store/questionReducer";
import {
  clearAnswers,
  initializeAnswers,
  setAnswers,
} from "../../store/answerReducer";
import apiClient from "../../services/api";
import { getInitValue, getStartByQuestionType, getTitle } from "../../utils";

const { Option } = Select;

const ReadingAnswers = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [selectQuestionType, setSelectQuestionType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isRefresh, setRefresh] = useState(false);

  const navigate = useNavigate();
  const { answers } = useSelector((state) => state.answer);

  const { data, loading, error } = useApiRequest(
    `/api/v1/reading/passage/${id}`,
    [id]
  );
  const questionTypes = useApiRequest(`/api/v1/question-type/all?type=READING`);
  const questions = useApiRequest(`/api/v1/reading/passage/${id}/questions`, [
    id,
    isRefresh,
  ]);

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
            startNumber: getStartByQuestionType(data.data.type) + 1,
            initKeys: [],
          })
        );
      }
    }
  }, [questions.data]);

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

  const getMinMaxQuestionIds = (content) => {
    const ids = content
      .filter(
        (node) => node.type === "multiple-choice" && typeof node.id === "number"
      )
      .map((node) => node.id);

    const min = ids[0];
    const max = ids[ids.length - 1];
    return min == max ? `${min}` : `${min}-${max}`;
  };

  const getLastQuestionId = (questions) => {
    if (!questions || questions.length === 0) return 0;
    const lastQuestion = questions[questions.length - 1];
    let max = 0;

    function traverse(node) {
      if (Array.isArray(node)) {
        node.forEach(traverse);
      } else if (typeof node === "object" && node !== null) {
        if (node.type === "input" && typeof node.placeholder === "number") {
          max = Math.max(max, node.placeholder);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(lastQuestion.content);
    if (max === 0) {
      const result = getListMinMax(lastQuestion.content);
      if (result) {
        max = result.max;
      }
    }
    if (max === 0) {
      const questionIds = getMinMaxQuestionIds(lastQuestion.content);
      if (questionIds !== "") {
        const parts = questionIds.split("-");
        if (parts.length === 2) {
          max = parseInt(parts[1], 10);
        }
      }
    }
    return max;
  };

  const countLists = () => {
    let count = 0;
    for (const node of data.data.content) {
      if (node.type === "ordered-list") {
        count +=
          node.children?.filter((child) => child.type === "list-item").length ||
          0;
      }
    }
    return count;
  };

  function getListMinMax(nodes) {
    for (const node of nodes) {
      if (node.type === "ordered-list" && Array.isArray(node.children)) {
        const start = typeof node.start === "number" ? node.start : 1;
        const itemCount = node.children.filter(
          (child) => child.type === "list-item"
        ).length;
        const min = start;
        const max = start + itemCount - 1;
        return { min, max };
      }
      if (node.children) {
        const result = getListMinMax(node.children);
        if (result) return result;
      }
    }
    return null;
  }

  const getStart = () => {
    const lastQuestionNumber = getLastQuestionId(
      questions.data?.data?.questions
    );
    const startByQuestionType = getStartByQuestionType(
      data?.data?.type,
      "READING"
    );
    let start = 0;
    if (lastQuestionNumber > 0) {
      start = lastQuestionNumber;
    } else {
      start = startByQuestionType + lastQuestionNumber;
    }
    return start;
  };

  const getQuestionNumbers = (question) => {
    if (question.type === "Multiple Choice")
      return getMinMaxQuestionIds(question.content);

    const extractPlaceholders = (nodes) => {
      return nodes.flatMap((node) => {
        let placeholders = [];

        if (node.type === "input" && typeof node.placeholder === "number") {
          placeholders.push(node.placeholder);
        }

        if (Array.isArray(node.children)) {
          placeholders.push(...extractPlaceholders(node.children));
        }

        return placeholders;
      });
    };
    const placeholders = extractPlaceholders(question.content);
    if (placeholders.length === 0) {
      const result = getListMinMax(question.content);
      if (result) {
        return result.min == result.max
          ? result.min
          : `${result.min}-${result.max}`;
      }
    }
    const min = placeholders[0];
    const max = placeholders[placeholders.length - 1];
    return min === max ? `${min}` : `${min}-${max}`;
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
          <RichTextViewer content={data.data.content} is_passage={true} />
        </Layout>
        <div
          style={{
            flex: 1,
            width: "50%",
            overflowY: "scroll",
            paddingLeft: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div>
              <div>
                {questionTypes.loading ? (
                  <Spin tip="Loading question types..." />
                ) : questionTypes.error || !questionTypes.data ? (
                  <Typography.Text type="danger">
                    Failed to load question types.
                  </Typography.Text>
                ) : (
                  <Select
                    style={{ width: "250px" }}
                    value={selectQuestionType}
                    onChange={(value) => {
                      dispatch(setQuestionType(value));
                      setSelectQuestionType(value);
                    }}
                    placeholder="Select question type"
                  >
                    <Option value="all" disabled>
                      Select questions types:
                    </Option>
                    {questionTypes.data.data.map((type) => (
                      <Option key={type.id} value={type.type}>
                        {type.name}
                      </Option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
            <Button
              type="primary"
              onClick={() => {
                if (selectQuestionType === "all") {
                  toast.error("Please select a question type first.");
                  return;
                }
                setIsModalOpen(true);
              }}
            >
              Add question
            </Button>
          </div>
          {questions.loading ? (
            <Skeleton active />
          ) : (
            questions.data &&
            questions.data?.data?.questions.map((question) => (
              <div key={question.id}>
                <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                  Questions {getQuestionNumbers(question)}
                </p>
                <RichTextViewer
                  content={question.content}
                  headings={countLists()}
                  type={question.type}
                />
              </div>
            ))
          )}
        </div>
      </div>
      <QuestionModal
        isOpen={isModalOpen}
        setOpen={setIsModalOpen}
        title={getTitle(selectQuestionType, questionTypes.data?.data)}
        type={selectQuestionType}
        initialValue={getInitValue(readings_inits, selectQuestionType)}
        startQuestionId={getStart()}
        isRefresh={isRefresh}
        setRefresh={setRefresh}
      />
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
