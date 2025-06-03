import React, { useState, useRef } from "react";
import { Select, Flex, Button, Input } from "antd";
import RichTextEditor from "../../components/editor/RichTextEditor";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/api";

const { Option } = Select;

const NewReading = () => {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState();
  const [title, setTitle] = useState("");
  const [selectType, setSelectType] = useState("all");
  const navigate = useNavigate();

  const savePassage = async () => {
    if (!title || title.trim() === "") {
      toast.error("Please enter a title for the reading passage.");
      return;
    }
    if (!value || value.length === 0) {
      toast.error(
        "Please write or paste the reading passage before proceeding."
      );
      return;
    }

    if (selectType === "all") {
      toast.error(
        "Please select a specific reading passage type before proceeding."
      );
      return;
    }
    const data = {
      title: title,
      type: selectType,
      content: value,
    };
    setLoading(true);
    try {
      const response = await apiClient.post("api/v1/reading/create/passage", data);
      if (response.code !== 200) {
        console.error("Failed to save reading passage:", response);
        toast.error("Failed to save reading passage.");
        return;
      }
      toast.success("Reading passage saved successfully.");
      navigate(`/dashboard/ielts/reading/${response.data.id}/questions`);
    } catch (error) {
      console.error("Error saving reading passage:", error);
      toast.error("An error occurred while saving the reading passage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <p>Choose which section you want to include Reading:</p>
        <Select
          defaultValue={selectType}
          style={{ width: "200px" }}
          onChange={(value) => setSelectType(value)}
        >
          <Option value="all">All</Option>
          <Option value="easy">Reading Passage 1</Option>
          <Option value="medium">Reading Passage 2</Option>
          <Option value="hard">Reading Passage 3</Option>
        </Select>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <p>Enter the title for the passage:</p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter passage title"
        />
      </div>
      <div>
        <p>Write or paste the reading passage in the editor below:</p>
        <RichTextEditor is_passage={true} value={value} setValue={setValue} />
      </div>
      <Flex style={{ justifyContent: "flex-end", marginTop: "10px" }}>
        <Button
          type="primary"
          onClick={savePassage}
          disabled={loading}
          loading={loading}
        >
          Next
        </Button>
      </Flex>
    </section>
  );
};

export default NewReading;
