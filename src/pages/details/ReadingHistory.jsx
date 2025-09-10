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

const ReadingHistory = () => {
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=reading`,
    [id]
  );

  // --- helpers (NOT hooks) ---
  const isCorrect = (answer, userAnswers) => {
    if (answer.key) return checkKey(answer, userAnswers);
    if (answer.keys) return checkKeys(answer, userAnswers) > 0;
    return false;
  };

  const questionMinKey = (answer) => {
    if (answer.key) return Number(answer.key);
    if (answer.keys) {
      const [minKey] = String(answer.keys).split("-").map(Number);
      return minKey;
    }
    return Number.MAX_SAFE_INTEGER;
  };

  const partLabel = (minKey) => {
    if (minKey >= 1 && minKey <= 13) return "Part 1 (Q1-13)";
    if (minKey >= 14 && minKey <= 26) return "Part 2 (Q14-26)";
    return "Part 3 (Q27-40)";
  };

  const questionKeyText = (answer) =>
    answer.key ? String(answer.key) : String(answer.keys);

  const correctValueOf = (answer) => {
    if (answer.value) return answer.value;
    if (Array.isArray(answer.values)) return answer.values.join(", ");
    return answer.values ?? "-";
  };

  const getUserValue = (answer, userAnswers) => {
    if (!Array.isArray(userAnswers)) return "-";
    for (const ans of userAnswers) {
      if (answer.key && ans.key === answer.key) return ans.value ?? "-";
      if (answer.keys && ans.keys === answer.keys) {
        if (Array.isArray(ans.values)) return ans.values.join(", ");
        return ans.values ?? "-";
      }
    }
    return "-";
  };

  const correctCount = useMemo(() => {
    if (!data?.data?.answers || !data?.data?.userAnswers) return 0;
    return countCorrectAnswers(data.data.answers, data.data.userAnswers);
  }, [data]);

  const tableData = useMemo(() => {
    const answers = data?.data?.answers ?? [];
    const userAnswers = data?.data?.userAnswers ?? [];

    return answers
      .map((answer) => {
        const minKey = questionMinKey(answer);
        const correct = isCorrect(answer, userAnswers);
        const userValue = getUserValue(answer, userAnswers);

        return {
          key: answer.key ?? answer.keys,
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

  // columns are static (not hooks)
  const columns = [
    {
      title: "Part",
      dataIndex: "part",
      key: "part",
      filters: [
        { text: "Part 1 (Q1-13)", value: "Part 1 (Q1-13)" },
        { text: "Part 2 (Q14-26)", value: "Part 2 (Q14-26)" },
        { text: "Part 3 (Q27-40)", value: "Part 3 (Q27-40)" },
      ],
      onFilter: (value, record) => record.part === value,
      width: 150,
    },
    {
      title: "Question",
      dataIndex: "qNumber",
      key: "qNumber",
      width: 95,
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
      render: (text, record) =>
        record.correct ? (
          <span style={{ color: "#52c41a", fontWeight: 500 }}>
            {record.userAnswer}
          </span>
        ) : (
          <span style={{ color: "#f5222d", fontWeight: 500 }}>
            {record.userAnswer}
          </span>
        ),
    },
    {
      title: "Result",
      dataIndex: "correct",
      key: "result",
      align: "center",
      width: 120,
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

  const totalCount = 40;

  // --- early returns AFTER all hooks ---
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
        📘 Reading History
      </Title>

      <Text style={{ fontSize: 18, marginBottom: 16, display: "block" }}>
        <strong>Correct Answers:</strong> {correctCount} / {totalCount}
      </Text>

      <StyledTableWrapper>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 40, showSizeChanger: false, }}
          rowClassName={(record) =>
            record.correct ? "correct-row" : "wrong-row"
          }
          bordered
        />
      </StyledTableWrapper>
    </Container>
  );
};

export default ReadingHistory;
