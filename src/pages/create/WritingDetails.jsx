import React from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Card,
  Flex,
  Input,
  Layout,
  Radio,
  Spin,
  Typography,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger";

const WritingDetails = () => {
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(`api/v1/writing/get/${id}`, [
    id,
  ]);

  if (loading)
    return (
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Spin tip="Loading..." />
      </Layout>
    );
  if (!data | error)
    return (
      <Typography.Text type="danger">Error: {error?.message}</Typography.Text>
    );

  return (
    <div style={{ padding: "20px" }}>
      <Radio.Group
        onChange={(e) => {}}
        value={data.data.task ? "taskOne" : "taskTwo"}
        style={{ marginBottom: "20px" }}
      >
        <Radio value="taskOne">Task One</Radio>
        <Radio value="taskTwo">Task Two</Radio>
      </Radio.Group>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
          Task {data.data.task ? "One" : "Two"}
        </h2>
        <Input.TextArea
          rows={5}
          placeholder={`Enter task ${data.data.task ? "one" : "two"} topic`}
          value={data.data.title}
          //   onChange={(e) => setTaskContent(e.target.value)}
          style={{ marginBottom: "20px" }}
        />
      </div>
      {data.data.task && (
        <div style={{ marginBottom: "20px" }}>
          {data.data.image ? (
            <Card>
              <img
                src={data.data.image}
                alt="Uploaded"
                style={{
                  maxWidth: "600px",
                  borderRadius: "8px",
                }}
              />
            </Card>
          ) : (
            <Dragger
              {...props}
              style={{ padding: "20px", borderRadius: "8px" }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Only one image file is allowed. Strictly prohibited from
                uploading company data or other banned files.
              </p>
              {uploadProgress > 0 && (
                <p style={{ marginTop: "10px" }}>
                  Upload Progress: {uploadProgress}%
                </p>
              )}
            </Dragger>
          )}
        </div>
      )}
      <Flex style={{ justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={() => {}}
          loading={loading}
          disabled={loading}
        >
          Update
        </Button>
      </Flex>
    </div>
  );
};

export default WritingDetails;
