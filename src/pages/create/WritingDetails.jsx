import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import { Button, Card, Input, Layout, Radio, Spin, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger";
import apiClient from "../../services/api";
import { toast } from "react-toastify";

const WritingDetails = () => {
  const { id } = useParams();
  const [refresh, setRefresh] = useState(0);
  const { data, loading, error } = useApiRequest(`api/v1/writing/get/${id}`, [id, refresh]);

  const [taskContent, setTaskContent] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const navigate = useNavigate();


  const handleFileUpload = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "WRITING");

    apiClient
      .post(`api/v1/writing/photo/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded / total) * 100);
          setUploadProgress(percentCompleted);
        },
      })
      .then((response) => {
        const imageUrl = response.data?.url;
        if (imageUrl) {
          setUploadedImageUrl(imageUrl);
          toast.success(`${file.name} uploaded successfully.`);
          setRefresh((prev) => prev + 1);
        } else {
          toast.error("Failed to retrieve image URL from server.");
        }
      })
      .catch(() => {
        toast.error(`${file.name} upload failed.`);
      });

    return false;
  };

  const deleteImage = async () => {
    if (!data?.data?.image) {
      toast.error("No image to delete.");
      return;
    }

    try {
      const response = await apiClient.delete(`api/v1/file/delete/${id}`, {
        params: { url: data.data.image },
      });

      if (response.code !== 200) {
        toast.error(response.message || "Failed to delete image!");
        return;
      }

      setRefresh((prev) => prev + 1);
      setUploadedImageUrl("");
      toast.success("Image deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete image!");
      console.error("Error deleting image:", error);
    }
  };

  // Props for the Dragger component
  const draggerProps = {
    name: "file",
    multiple: false,
    accept: "image/*", // Only accept image files
    beforeUpload: handleFileUpload,
    onDrop: (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
  };

  if (loading) {
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
  }

  if (error || !data) {
    return (
      <Typography.Text type="danger">
        Error: {error?.message || "Failed to fetch data"}
      </Typography.Text>
    );
  }

  const handleUpdate = async () => {
    const requestBody = {
      title: taskContent || data.data.title,
      task: data.data.task,
      image: uploadedImageUrl || data.data.image,
    };
    setUpdateLoading(false);
    try {
      const response = await apiClient.put(`api/v1/writing/update/${id}`, requestBody);
      if (response.code != 200) {
        toast.error(response.message || "Failed Update Writing");
        return;
      }
      toast.success("Successfull writing updated")
      navigate("/dashboard/ielts/writing");
    } catch (error) {
      toast.error(error.message || "Failed update writing!")
      console.log("Failed update: ", error); 
    } finally {
      setUpdateLoading(true);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Task Selection */}
      <Radio.Group
        onChange={(e) => console.log("Selected task:", e.target.value)}
        value={data.data.task ? "taskOne" : "taskTwo"}
        style={{ marginBottom: "20px" }}
      >
        <Radio value="taskOne">Task One</Radio>
        <Radio value="taskTwo">Task Two</Radio>
      </Radio.Group>

      {/* Task Content */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
          Task {data.data.task ? "One" : "Two"}
        </h2>
        <Input.TextArea
          rows={5}
          placeholder={`Enter task ${data.data.task ? "one" : "two"} topic`}
          value={taskContent || data.data.title}
          onChange={(e) => setTaskContent(e.target.value)}
          style={{ marginBottom: "20px" }}
        />
      </div>

      {/* Image Upload or Display */}
      <div style={{ marginBottom: "20px" }}>
        {data.data.task && (data.data.image || uploadedImageUrl ? (
          <Card>
            <img
              src={data.data.image}
              alt="Uploaded"
              style={{
                maxWidth: "600px",
                borderRadius: "8px",
              }}
            />
            <Button
              danger
              style={{ marginTop: "10px" }}
              onClick={deleteImage}
            >
              Delete Image
            </Button>
          </Card>
        ) : (
          <Dragger {...draggerProps} style={{ padding: "20px", borderRadius: "8px" }}>
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
        ))}
      </div>

      {/* Update Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={handleUpdate}
          loading={updateLoading}
          disabled={updateLoading}
        >
          Update
        </Button>
      </div>
    </div>
  );
};

export default WritingDetails;
