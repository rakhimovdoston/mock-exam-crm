import React, { useState } from "react";
import { Upload, Radio, Input, Button, message, Card, Flex } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import apiClient from "../../services/api"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const { Dragger } = Upload;

const NewWriting = () => {
  const [isTaskOne, setIsTaskOne] = useState(true);
  const [taskContent, setTaskContent] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const props = {
    name: "file",
    multiple: false,
    accept: "image/*",
    beforeUpload(file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "WRITING")
      apiClient
        .post("api/v1/file/photo", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentCompleted = Math.round((loaded / total) * 100);
            setUploadProgress(percentCompleted);
          },
        })
        .then((response) => {
          const imageUrl = response.data?.url; // Assuming server returns the image URL in `response.data.url`
          if (imageUrl) {
            setUploadedImageUrl(imageUrl);
            message.success(`${file.name} image uploaded successfully.`);
          } else {
            message.error("Failed to retrieve image URL from server.");
          }
        })
        .catch(() => {
          message.error(`${file.name} image upload failed.`);
        });

      return false;
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleSubmit = async () => {

    if (!taskContent.trim()) {
      toast.error("Please enter the task content.");
      return;
    }

    if (isTaskOne && uploadedImageUrl === "") {
      toast.error("Please upload an image for Task One.");
      return;
    }
    
    const taskData = {
      task: isTaskOne,
      title: taskContent,
      image: uploadedImageUrl,
    };

    setLoading(true);
    try {
      const response = await apiClient.post("api/v1/writing/save", taskData);
      if (response.code != 200) {
        toast.error(response.message || "Failed to submit task. Please try again.");
        return;
      }
      toast.success("Task submitted successfully!");
      navigate("/dashboard/ielts/writing");

    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error(error.message || "Failed to submit task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Radio.Group
        onChange={(e) => setIsTaskOne(e.target.value === "taskOne")}
        value={isTaskOne ? "taskOne" : "taskTwo"}
        style={{ marginBottom: "20px" }}
      >
        <Radio value="taskOne">Task One</Radio>
        <Radio value="taskTwo">Task Two</Radio>
      </Radio.Group>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
          Task {isTaskOne ? "One" : "Two"}
        </h2>
        <Input.TextArea
          rows={5}
          placeholder={`Enter task ${isTaskOne ? "one" : "two"} topic`}
          value={taskContent}
          onChange={(e) => setTaskContent(e.target.value)}
          style={{ marginBottom: "20px" }}
        />
      </div>
      {isTaskOne && (
        <div style={{ marginBottom: "20px" }}>
          {uploadedImageUrl ? (
            <Card
              cover={
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  style={{
                    maxWidth: "600px",
                    borderRadius: "8px",
                  }}
                />
              }
            >
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
        <Button type="primary" onClick={handleSubmit} loading={loading} disabled={loading}>
          Submit
        </Button>
      </Flex>
    </div>
  );
};

export default NewWriting;
