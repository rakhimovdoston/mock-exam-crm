import React, { useState } from "react";
import { Modal, Button } from "antd";
import { getLastQuestionId } from "../../utils";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useParams } from "react-router-dom";

const DeleteModal = ({
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

  const deleteQuestions = async () => {
    const startQuestion = questions.filter(
      (question) => question.id < selectedQuestion.id
    );
    const nextQuestions = questions.filter(
      (question) => question.id > selectedQuestion.id
    );
    const newQuestion = [...startQuestion, ...nextQuestions];
    const updateQuestions = [];
    for (const question of newQuestion) {
      const startQuestion = getStart(updateQuestions);
      const newQues = {
        id: question.id,
        type: question.type,
        content: renumberSlateQuestionsSmart(
          question.content,
          startQuestion + 1
        ),
      };
      updateQuestions.push(newQues);
    }
    setLoading(true);
    const requestBody = {
      questions: updateQuestions.map((question) => {
        return {
          id: question.id,
          questionType: question.type,
          questionContent: question.content,
        };
      }),
    };
    try {
      const response = await apiClient.post(
        `api/v1/${type}/delete/${id}/questions`,
        requestBody
      );
      if (response.code != 200) {
        toast.error(response.error || "Failed delete message");
        return;
      }
      setOpen(false);
      setRefresh(!refresh);
    } catch (error) {
      toast.error(error.message || "Failed Delete message");
    } finally {
      setLoading(false);
    }
  };

  const getStart = (startQuestion) => {
    let startByQuestions = getLastQuestionId(startQuestion);
    if (startByQuestions == 0) {
      startByQuestions = start;
    }
    return startByQuestions;
  };

  function renumberSlateQuestionsSmart(json, defaultStart = 1) {
    let counter = defaultStart;

    function walk(node) {
      if (Array.isArray(node)) {
        node.forEach((child) => walk(child));
      } else if (typeof node === "object" && node !== null) {
        if (node.type === "ordered-list" && Array.isArray(node.children)) {
          node.start = counter;
          node.listStyleType = "decimal";

          node.children.forEach((child) => walk(child));
          return;
        }

        if (node.type === "input") {
          node.placeholder = counter++;
          return;
        }

        if (node.type === "multiple-choice") {
          node.id = counter++;
          return;
        }

        for (const key in node) {
          walk(node[key]);
        }
      }
    }

    const cloned = JSON.parse(JSON.stringify(json));
    walk(cloned);
    return cloned;
  }

  return (
    <Modal
      title="Delete confirm"
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <Button key="cancel" onClick={() => setOpen(false)}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={deleteQuestions}
          loading={loading}
        >
          Delete
        </Button>,
      ]}
    >
      <p>
        Are you sure you want to delete this <b>Questions {number}</b>
      </p>
    </Modal>
  );
};

export default DeleteModal;
