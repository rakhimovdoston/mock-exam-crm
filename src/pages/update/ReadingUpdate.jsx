import React, { useEffect, useState } from "react";
import {
  Select,
  Flex,
  Button,
  Input,
  Result,
  Spin,
  Layout,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import RichTextEditor from "../../components/editor/RichTextEditor";
import apiClient from "../../services/api";
import useApiRequest from "../../hooks/useApiRequest";
import emptyCart from "../../assets/not_found.svg";

const { Content } = Layout;
const { Option } = Select;
const { Title, Paragraph } = Typography;

const ReadingUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [selectType, setSelectType] = useState("all");
  const [value, setValue] = useState();
  const [loading, setLoading] = useState(false);

  const {
    data,
    loading: fetchLoading,
    error,
  } = useApiRequest(`/api/v1/reading/passage/${id}`, [id]);

  useEffect(() => {
    if (data?.data) {
      const { title, type, content } = data.data;
      setTitle(title);
      setSelectType(type);
      setValue(content);
    }
  }, [data]);

  const savePassage = async () => {
    if (!title.trim()) {
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

    const payload = { title, type: selectType, content: value };

    setLoading(true);
    try {
      const response = await apiClient.put(
        `api/v1/reading/update/${id}`,
        payload
      );
      if (response.code !== 200) {
        console.error("Failed to save reading passage:", response);
        toast.error("Failed to save reading passage.");
        return;
      }
      toast.success("Reading passage saved successfully.");
      navigate(`/dashboard/ielts/reading/${id}/questions`);
    } catch (err) {
      console.error("Error saving reading passage:", err);
      toast.error("An error occurred while saving the reading passage.");
    } finally {
      setLoading(false);
    }
  };

  // Loader
  if (fetchLoading) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </Layout>
    );
  }

  // Error or no data
  if (!data || error || data.code !== 200) {
    return (
      <Result
        status="404"
        title="No Data"
        subTitle={`No data found for this passage. ID: ${id}`}
        icon={<img src={emptyCart} alt="No Data" style={{ width: 300 }} />}
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />
    );
  }

  // Main UI
  return (
    <Layout style={{ padding: "24px" }}>
      <Content>
        <Title level={4}>Update Reading Passage</Title>

        <div style={{ marginBottom: 16 }}>
          <Paragraph>
            Choose which section to include the reading passage:
          </Paragraph>
          <Select
            value={selectType}
            onChange={setSelectType}
            style={{ width: 240 }}
            disabled
          >
            <Option value="all">All</Option>
            <Option value="easy">Reading Passage 1</Option>
            <Option value="medium">Reading Passage 2</Option>
            <Option value="hard">Reading Passage 3</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Paragraph>Enter the title for the passage:</Paragraph>
          <Input
            placeholder="Enter passage title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Paragraph>
            Write or paste the reading passage in the editor below:
          </Paragraph>
          <RichTextEditor
            is_passage
            value={value}
            setValue={setValue}
            passage_type={selectType}
            initValue={value}
          />
        </div>

        <Flex justify="flex-end">
          <Button
            type="primary"
            onClick={savePassage}
            disabled={loading}
            loading={loading}
          >
            Update
          </Button>
        </Flex>
      </Content>
    </Layout>
  );
};

export default ReadingUpdate;