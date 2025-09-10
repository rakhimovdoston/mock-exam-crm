import React, { useState, useMemo } from "react";
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
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";
import { useSelector } from "react-redux";

const { Option } = Select;

const SpeakingPage = () => {
  const [selectBranch, setSelectBranch] = useState();
  const [testTime, setTestTime] = useState("all");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [status, setStatus] = useState(); // <-- server filter: status
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [testType, setTestType] = useState("all");
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [selectRecord, setSelectRecord] = useState();
  const [refresh, setRefresh] = useState(0);

  const { user } = useSelector((state) => state.auth);

  // Build API url with server-side filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("size", size);
    params.set("type", "speaking");
    if (selectBranch) params.set("branch", selectBranch);
    if (testTime !== "all") params.set("time", testTime);
    if (startDate) params.set("date", startDate);
    if (status) params.set("status", status.join(",")); // <-- include status
    return `api/v1/speaking/all?${params.toString()}`;
  }, [page, size, selectBranch, testTime, startDate, status, refresh]);

  const { data, loading } = useApiRequest(apiUrl, [apiUrl]);

  const handleSpeakingModalOk = async () => {
    const value = parseFloat(selectedSpeakingScore);
    if (Number.isNaN(value) || value < 0 || value > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0.");
      return;
    }
    if (!selectRecord) {
      toast.error("Please select a record to set the score.");
      return;
    }

    setSpeakingLoading(true);
    try {
      const response = await apiClient.post(
        `api/v1/booking/speaking-score?id=${selectRecord.id}&score=${value}`
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score error");
        return;
      }
      toast.success("Score saved");
      setIsSpeakingModalVisible(false);
      setSelectedSpeakingScore(null);
      setErrorMessage("");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Failed to set score");
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
    const value = e.target.value;
    setSelectedSpeakingScore(value);
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0 || num > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  // Server-side table change handler (fires after user clicks OK in filters)
  const handleTableChange = (pagination, filters /*, sorter*/) => {
    setPage((pagination.current || 1) - 1);
    setSize(pagination.pageSize || 10);

    // filters.status is an array of selected values (we'll use the first)
    const nextStatus = Array.isArray(filters?.status) ? filters.status : [];
    setStatus(nextStatus); // triggers URL rebuild -> refetch
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1 + page * size,
      width: 70,
    },
    {
      title: "Student",
      dataIndex: "studentName",
      key: "studentName",
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
      title: "Test Date",
      dataIndex: "testDate",
      key: "testDate",
    },
    {
      title: "Time Slot",
      dataIndex: "time",
      key: "time",
      render: (time) => `🕒 ${time}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      // IMPORTANT: use filters + controlled filteredValue for server-side filtering
      filters: [
        { text: "Waiting", value: "WAITING" },
        { text: "Process", value: "PROCESS" },
        { text: "Completed", value: "COMPLETED" },
        { text: "Failed", value: "FAILED" },
      ],
      filterMultiple: true,
      filteredValue: Array.isArray(status) && status.length ? status : null, // controlled UI state
      render: (status) => {
        let color = "blue";
        if (status === "COMPLETED") color = "green";
        else if (status === "PROCESS") color = "orange";
        else if (status === "WAITING") color = "geekblue";
        else if (status === "FAILED") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
      // DO NOT use onFilter here (client-side). We handle it in handleTableChange.
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Flex justify="center" align="center" gap={12}>
          {record.type === "SPEAKING" &&
            checkRole(user.roles, Role.ROLE_SPEAKER) && (
              <Button
                type="primary"
                onClick={() => {
                  setSelectRecord(record);
                  setIsSpeakingModalVisible(true);
                }}
              >
                Set Score
              </Button>
            )}
          <Button type="primary">
            <Link to={`${record.id}/${record.type}`} style={{ color: "white" }}>
              Details
            </Link>
          </Button>
        </Flex>
      ),
    },
  ];

  const branches = useApiRequest(`api/v1/branch/all`);

  return (
    <div>
      <h2>📋 Upcoming Speaking</h2>
      <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
        {checkRole(user.roles, Role.ROLE_ADMIN) && (
          <Select
            placeholder="Select branch"
            style={{ width: 300 }}
            allowClear
            value={selectBranch}
            onChange={(value) => {
              setSelectBranch(value);
              setPage(0);
            }}
          >
            {branches.data?.data?.branches?.map((branch) => (
              <Option key={branch.id} value={branch.id}>
                {branch.name}
              </Option>
            ))}
          </Select>
        )}

        <DatePicker
          style={{ width: 170 }}
          allowClear
          value={dayjs(startDate, "YYYY-MM-DD")}
          onChange={(date) => {
            if (date) setStartDate(dayjs(date).format("YYYY-MM-DD"));
            else setStartDate(dayjs().format("YYYY-MM-DD"));
            setPage(0);
          }}
        />
      </Space>

      <Table
        columns={columns}
        loading={loading}
        dataSource={
          data?.code === 200 && data?.data?.data
            ? data.data.data.map((item, index) => ({ ...item, key: index }))
            : []
        }
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data?.data?.totalSizes,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        onChange={handleTableChange} // <-- refetch on filter OK
      />

      <Modal
        title="Speaking Assessment"
        open={isSpeakingModalVisible}
        onOk={handleSpeakingModalOk}
        onCancel={handleSpeakingModalCancel}
        confirmLoading={speakingLoading} // <-- correct prop
        okButtonProps={{ disabled: speakingLoading }}
      >
        <p>Current Speaking Score: {selectedSpeakingScore ?? "0.0"} ball</p>
        <Input
          min={0.0}
          max={9.0}
          step={0.5}
          value={selectedSpeakingScore}
          placeholder="Enter new speaking score (5.5)"
          type="number"
          onChange={handleInputChange}
        />
        {errorMessage && (
          <p style={{ color: "red", marginTop: 10 }}>{errorMessage}</p>
        )}
      </Modal>
    </div>
  );
};

export default SpeakingPage;
