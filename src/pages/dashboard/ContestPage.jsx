import React, { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Flex,
  Modal,
} from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import apiClient from "../../services/api";
import { toast } from "react-toastify";

const { Option } = Select;

const ContestPage = () => {
  const [selectBranch, setSelectBranch] = useState();
  const [testTime, setTestTime] = useState("all");
  const [startDate, setStartDate] = useState();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [testType, setTestType] = useState("all");
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [selectRecord, setSelectRecord] = useState();
  const [refresh, setRefresh] = useState(0);

  const handleSpeakingModalOk = async () => {
    if (selectedSpeakingScore < 0 || selectedSpeakingScore > 9) {
      setErrorMessage("Score must be between 0 and 9.");
      return;
    }

    if (!selectRecord) {
      toast.error("Please select a record to set the score.");
      return;
    }
    setSpeakingLoading(true);

    try {
      const response = await apiClient.post(
        `api/v1/booking/speaking-score?id=${selectRecord.id}&score=${selectedSpeakingScore}`,
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score some error");
        return;
      }
      setIsSpeakingModalVisible(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Failed to set score");
      console.error("Error setting score:", err);
      setErrorMessage(err.message || "Failed to set score");
    } finally {
      setSpeakingLoading(false);
    }
  };

  const handleSpeakingModalCancel = () => {
    setErrorMessage("");
    setSelectedSpeakingScore(null);
    setIsSpeakingModalVisible(false);
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedSpeakingScore(e.target.value);
    if (value < 0 || value > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Test Date",
      dataIndex: "testDate",
      key: "testDate",
    },
    {
      title: "Student",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Phone number",
      dataIndex: "phoneNumber",
      key: "phoneNumber"
    },
    {
      title: "Test type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "TEST" ? "blue" : "green"}>{type}</Tag>
      ),
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
    },
    {
      title: "Speaker",
      dataIndex: "speakerName",
      key: "speakerName",
    },
    {
      title: "Time Slot",
      dataIndex: "time",
      key: "time",
      render: (time) => {
        const emoji =
          time === "morning"
            ? "☀️ "
            : time === "afternoon"
            ? "🌤 "
            : time === "evening"
            ? "🌙 "
            : "🕒 ";
        return `${emoji} ${time}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "COMPELETED") color = "green";
        else if (status === "PROCESS") color = "orange";
        else if (status === "IN_COMPLED") color = "gray";
        else if (status === "FAILED") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Flex justify="center" align="center" gap={12}>
          {record.type === 'SPEAKING' && <Button
            type="primary"
            onClick={() => {
              {
                setSelectRecord(record);
                setIsSpeakingModalVisible(true);
              }
            }}
          >
            Set Score
          </Button>}
          <Button type="primary" style={{ cursor: "pointer" }}>
            <Link
              to={`${record.id}/${record.type}`}
              style={{ cursor: "pointer", color: "white" }}
            >
              Details
            </Link>
          </Button>
        </Flex>
      ),
    },
  ];

  const { data, loading } = useApiRequest(
    `api/v1/booking/all?page=${page}&size=${size}${
      selectBranch ? "&branch=" + selectBranch : ""
    }${testTime === "all" ? "" : "&time=" + testTime}${
      startDate ? "&date=" + startDate : ""
    }${testType != "all" ? "&type=" + testType : ""}`,
    [page, size, selectBranch, testTime, startDate, testType, refresh]
  );

  const branches = useApiRequest(`api/v1/branch/all`);

  return (
    <div>
      <h2>📋 Upcoming Test Bookings</h2>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Select branch"
          style={{ width: 300 }}
          onChange={(value) => setSelectBranch(value)}
        >
          {branches.data?.data?.branches?.map((branch) => (
            <Option key={branch.id} value={branch.id}>
              {branch.name}
            </Option>
          ))}
        </Select>
        <DatePicker
          style={{ width: "150px" }}
          onChange={(date) => {
            if (date) setStartDate(dayjs(date).format("YYYY-MM-DD"));
            else setStartDate();
          }}
        />
        <Select
          placeholder={"Time slot"}
          style={{ width: 300 }}
          defaultValue={testTime}
          onChange={(value) => setTestTime(value)}
        >
          <Option key={"all"}>All</Option>
          {branches?.data?.data?.testTimes?.map((time) => (
            <Option key={time}>
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Test type (Test session, speaking)"
          style={{ width: 120 }}
          defaultValue={testType}
          onChange={(value) => setTestType(value)}
        >
          <Option key={"all"}>All</Option>
          <Option key={"full"}>Test</Option>
          <Option key={"speaking"}>Speaking</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        loading={loading}
        dataSource={
          data?.code === 200 && data?.data?.data
            ? data?.data.data.map((item, index) => ({ ...item, key: index }))
            : []
        }
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data?.data?.totalSizes,
          onChange: (page, size) => {
            setPage(page - 1);
            setSize(size);
          },
        }}
      />

      <Modal
        title="Speaking Assessment"
        open={isSpeakingModalVisible}
        loading={speakingLoading}
        onOk={handleSpeakingModalOk}
        okButtonProps={{
          disabled: loading,
          loading: loading,
        }}
        onCancel={handleSpeakingModalCancel}
      >
        <p>Current Speaking Score: {selectedSpeakingScore ?? "0.0"} ball</p>
        <Input
          min={0.0}
          max={9.0}
          value={selectedSpeakingScore}
          placeholder="Enter new speaking score (5.5)"
          type="number"
          onChange={handleInputChange}
        />
        {errorMessage && (
          <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>
        )}
      </Modal>
    </div>
  );
};

export default ContestPage;
