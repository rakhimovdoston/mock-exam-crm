import React, { useMemo } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Layout, Spin, Typography, Table, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { checkKey, checkKeys, countCorrectAnswers } from "../../utils";

const { Title, Text } = Typography;

const Container = styled(Layout)`
  background: #fafafa;
  padding: 32px;
  border-radius: 16px;
  min-height: 100vh;
`;

const StyledTableWrapper = styled.div`
  .ant-table-tbody > tr.correct-row > td {
    background: #f6ffed;
  }
  .ant-table-tbody > tr.wrong-row > td {
    background: #fff1f0;
  }
`;

const ListeningHistory = () => {
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=listening`,
    [id]
  );

  // --- Helpers from your logic ---
  const getValue = (answer, userAnswers) => {
    for (const ans of userAnswers) {
      if (answer.key && ans.key === answer.key) return ans.value ?? "-";
      if (answer.keys && ans.keys === answer.keys)
        return Array.isArray(ans.values) ? ans.values.join(", ") : ans.values ?? "-";
    }
    return "-";
  };

  const isCorrect = (answer, userAnswers) => {
    if (answer.key) return checkKey(answer, userAnswers);
    if (answer.keys) {
      const count = checkKeys(answer, userAnswers);
      return count > 0;
    }
    return false;
  };

  const correctCount = useMemo(() => {
    if (!data?.data?.answers || !data?.data?.userAnswers) return 0;
    return countCorrectAnswers(data.data.answers, data.data.userAnswers);
  }, [data]);

  const totalCount = 40;

  // --- Table-specific helpers ---
  const partLabel = (minKey) => {
    if (minKey >= 1 && minKey <= 10) return "Part 1";
    if (minKey >= 11 && minKey <= 20) return "Part 2";
    if (minKey >= 21 && minKey <= 30) return "Part 3";
    return "Part 4";
  };

  const questionKeyText = (answer) => (answer.key ? String(answer.key) : String(answer.keys));

  const questionMinKey = (answer) => {
    if (answer.key) return Number(answer.key);
    if (answer.keys) {
      const [minKey] = String(answer.keys).split("-").map(Number);
      return minKey;
    }
    return Number.MAX_SAFE_INTEGER;
  };

  const correctValueOf = (answer) =>
    answer.value ? answer.value : Array.isArray(answer.values) ? answer.values.join(", ") : "-";

  // Build table data
  const tableData = useMemo(() => {
    if (!data?.data?.answers || !data?.data?.userAnswers) return [];

    const { answers, userAnswers } = data.data;

    return answers
      .map((answer) => {
        const minKey = questionMinKey(answer);
        const correct = isCorrect(answer, userAnswers);
        const userValue = getValue(answer, userAnswers);

        return {
          key: answer.key ?? answer.keys, // React key
          part: partLabel(minKey),
          qNumber: questionKeyText(answer),
          correctAnswer: correctValueOf(answer),
          userAnswer: userValue,
          correct,
          sortKey: minKey,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [data]);

  // Table columns
  const columns = [
    {
      title: "Part",
      dataIndex: "part",
      key: "part",
      filters: [
        { text: "Part 1 (Q1–10)", value: "Part 1" },
        { text: "Part 2 (Q11–20)", value: "Part 2" },
        { text: "Part 3 (Q21–30)", value: "Part 3" },
        { text: "Part 4 (Q31–40)", value: "Part 4" },
      ],
      onFilter: (value, record) => record.part === value,
      width: 120,
    },
    {
      title: "Question",
      dataIndex: "qNumber",
      key: "qNumber",
      width: 120,
    },
    {
      title: "Correct Answer",
      dataIndex: "correctAnswer",
      key: "correctAnswer",
      ellipsis: true,
    },
    {
      title: "Your Answer",
      dataIndex: "userAnswer",
      key: "userAnswer",
      ellipsis: true,
      render: (_, record) =>
        record.correct ? (
          <span style={{ color: "#52c41a", fontWeight: 500 }}>{record.userAnswer}</span>
        ) : (
          <span style={{ color: "#f5222d", fontWeight: 500 }}>{record.userAnswer}</span>
        ),
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "result",
      align: "center",
      width: 110,
      render: (correct) =>
        correct ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Correct
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Wrong
          </Tag>
        ),
      filters: [
        { text: "Correct", value: true },
        { text: "Wrong", value: false },
      ],
      onFilter: (value, record) => record.correct === value,
    },
  ];

  if (loading)
    return (
      <Layout
        style={{
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100vh",
          background: "#fafafa",
        }}
      >
        <Spin tip="Loading..." size="large" />
      </Layout>
    );

  if (!data || error)
    return (
      <Text type="danger" style={{ fontSize: 18 }}>
        Mock test exam history not found
      </Text>
    );

  return (
    <Container>
      <Title level={3} style={{ marginBottom: 8 }}>
        🎧 Listening History
      </Title>

      <Text style={{ fontSize: 18, marginBottom: 16, display: "block" }}>
        <strong>Correct Answers:</strong> {correctCount} / {totalCount}
      </Text>

      <StyledTableWrapper>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 40, showSizeChanger: false }}
          rowClassName={(record) => (record.correct ? "correct-row" : "wrong-row")}
          bordered
        />
      </StyledTableWrapper>
    </Container>
  );
};

export default ListeningHistory;
