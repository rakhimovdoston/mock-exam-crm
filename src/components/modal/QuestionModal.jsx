import React, { useState } from "react";
import { Modal, Button } from "antd";
import RichTextEditor from "../editor/RichTextEditor";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useParams } from "react-router-dom";
import { Transforms } from "slate";

const QuestionModal = ({
  isOpen,
  title,
  type,
  setOpen,
  initialValue,
  startQuestionId,
  reading = true,
  setRefresh,
  isRefresh,
}) => {
  const [value, setValue] = useState();
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const formattedInitialValue = Array.isArray(initialValue)
    ? initialValue
    : [
        {
          type: "paragraph",
          children: [{ text: initialValue?.children?.[0]?.text || "" }],
        },
      ];

  const handleSubmit = async () => {
    setLoading(true);
    const requestBody = {
      questionType: type,
      questionContent: value,
    };

    try {
      const response = await apiClient.post(
        reading
          ? `api/v1/reading/passage/${id}/save/question`
          : `api/v1/listening/${id}/save/question`,
        requestBody
      );
      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to submit question. Please try again."
        );
        return;
      }
      toast.success("Question submitted successfully!");
      setRefresh(!isRefresh);
      setOpen(false);
      setValue([]);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to submit question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={"Add " + title}
      open={isOpen}
      width={800}
      closable={false}
      footer={[
        <Button
          key="cancel"
          danger
          onClick={() => {
            setValue([]);
            setOpen(false);
          }}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={loading}
        >
          Save
        </Button>,
      ]}
    >
      <p>Enter your question for {title}:</p>
      <RichTextEditor
        is_passage={false}
        value={value}
        setValue={setValue}
        initValue={formattedInitialValue}
        startQuestionId={startQuestionId}
      />
    </Modal>
  );
};

export default QuestionModal;
