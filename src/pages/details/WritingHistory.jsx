import React from 'react'
import { useParams } from 'react-router-dom';
import useApiRequest from '../../hooks/useApiRequest';
import { Col, Divider, Input, Layout, Row, Spin, Typography } from 'antd';

const WritingWriting = () => {

  const {id} = useParams();

  const { data, loading, error } = useApiRequest(`api/v1/history/mock-exam/${id}?type=writing`, [id]);

  if (loading)
    return (
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin tip="Loading..." />
      </Layout>
    );
  if (!data | error)
    return (
      <Typography.Text type="danger">Mock test exam history not found</Typography.Text>
    );

  return (
    <Layout style={{ padding: '20px' }}>
      {data.data.questions
        .map((question, index) => {
          const answer = data.data.answers.find((ans) => ans.writingId === question.id);
          return (
            <div key={question.id} style={{ marginBottom: '20px' }}>
              <Typography.Title level={3}>Task {question.task ? "One" : "Two"}</Typography.Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Typography.Title level={5}>Topic</Typography.Title>
                  <Typography.Paragraph>{question.title}</Typography.Paragraph>
                  {question.image && (
                    <img
                      src={question.image}
                      alt={`Task ${index + 1} illustration`}
                      style={{ maxWidth: '100%', marginTop: '10px' }}
                    />
                  )}
                </Col>
                <Col span={12}>
                  <Typography.Title level={5}>User's Answer</Typography.Title>
                  <Input.TextArea style={{minHeight: "450px"}} readOnly value={answer ? answer.answer : null} />
                </Col>
              </Row>
              <Divider />
            </div>
          );
        })}
        <Divider />
    </Layout>
  )
}

export default WritingWriting;