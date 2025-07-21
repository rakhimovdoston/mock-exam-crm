import React, { useState } from "react";
import { Modal, Button } from "antd";
import {
  existMatchingHeadingsQuestions,
  getLastQuestionId,
  renumberSlateQuestionsSmart,
} from "../../utils";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useParams } from "react-router-dom";
import RichTextEditor from "../editor/RichTextEditor";

const UpdateModal = ({
  open,
  setOpen,
  type,
  number,
  questions,
  selectedQuestion,
  start,
  setRefresh,
  refresh,
}) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  console.log("Start update: ", start);

  const [value, setValue] = useState(selectedQuestion.content);

  const updateQuestions = async () => {
    const newQuestion = [...questions];
    const updateIndex = newQuestion.findIndex(
      (item) => item.id === selectedQuestion.id
    );
    const updatedQuestions = {
      id: selectedQuestion.id,
      content: value,
      type: selectedQuestion.type,
      order: selectedQuestion.order,
    };
    if (updateIndex == -1) {
      toast.error("Please select for update questions");
      return;
    }
    newQuestion[updateIndex] = updatedQuestions;
    const newUpdateQuestions = [];
    let order = 1;
    if (selectedQuestion.type !== "Matching Headings") {
      for (const question of newQuestion) {
        const startQuestion = getStart(newUpdateQuestions);
        const newQues = {
          id: question.id,
          type: question.type,
          content: renumberSlateQuestionsSmart(
            question.content,
            startQuestion + 1
          ),
          order: order,
        };
        newUpdateQuestions.push(newQues);
        order = order + 1;
      }
    }

    const questionsUpdated =
      selectedQuestion.type !== "Matching Headings"
        ? newUpdateQuestions
        : newQuestion;

    setLoading(true);
    const requestBody = {
      questions: questionsUpdated.map((ques) => {
        return {
          id: ques.id,
          questionType: ques.type,
          questionContent: ques.content,
          order: ques.order,
        };
      }),
    };

    try {
      const response = await apiClient.put(
        `api/v1/${type}/update/${id}/questions`,
        requestBody
      );
      if (response.code != 200) {
        toast.error(response.error || "Failed update content");
        return;
      }
      setRefresh(!refresh);
      setOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed update content");
    } finally {
      setLoading(false);
    }
  };

  const getStart = (questionStartAfterChange) => {
    if (!questionStartAfterChange || questionStartAfterChange.length === 0)
      return start;
    const lastQuestion =
      questionStartAfterChange[questionStartAfterChange.length - 1];

    if (lastQuestion.type === "Matching Headings") {
      return start;
    }

    let startByQuestions = getLastQuestionId(questionStartAfterChange);
    if (startByQuestions == 0) {
      startByQuestions = start;
    }
    return startByQuestions;
  };

  const getQuestionLastNumbers = (question) => {
    const newQuestions = [];
    newQuestions.push(question);
    const start = getLastQuestionId(newQuestions);
    return Number(start);
  };

  return (
    <Modal
      title={
        <p>
          Update <b>Questions {number}</b>
        </p>
      }
      width={800}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <Button key="cancel" onClick={() => setOpen(false)}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={updateQuestions}
          loading={loading}
        >
          Update
        </Button>,
      ]}
    >
      <RichTextEditor
        initValue={selectedQuestion.content}
        value={value}
        setValue={setValue}
        startQuestionId={getQuestionLastNumbers(selectedQuestion)}
      />
    </Modal>
  );
};

export default UpdateModal;
