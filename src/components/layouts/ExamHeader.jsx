import React, { useEffect, useState } from 'react';
import { Layout, Button, Modal } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import apiClient from '../../services/api';

const { Header } = Layout;

const ExamHeader = ({ type }) => {
  const {id} = useParams();
  const [timeLeft, setTimeLeft] = useState(type === 'reading' ? 60 * 60 : 35 * 60);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const {answers} = useSelector((state) => state.exam);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsModalVisible(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModalOk = async () => {
    setLoading(true);
    const request = {
      type: type,
      questionAnswers: answers
    }
    try {
      const response = await apiClient.post(`/api/v1/exam/answers/${id}`, request);
      if (response.code !== 200) {
        toast.error(response.message || "Failed to submit answers. Please try again.");
        return;
      }
      toast.success("Answers submitted successfully!");
      navigate('/exam');
    } catch(error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Header style={{ textAlign: 'center', position: 'sticky', top: 0, background: "white", boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: "20px", fontWeight: 700 }}>{type === "reading" ? "Reading Test" : "Listening Test"}</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined style={{ fontSize: '16px' }} />
            {formatTime(timeLeft)}
          </span>
          <Button type="primary" style={{ fontWeight: 'bold' }} onClick={() => setIsModalVisible(true)}>
            Submit
          </Button>
        </div>
      </Header>
      <Modal
        title={timeLeft > 0 ? "Submiting answers" : "Time's Up!"}
        open={isModalVisible}
        closable={timeLeft > 0}
        footer={[
          <Button key="submit" type="primary" onClick={handleModalOk} loading={loading}>
            Submit
          </Button>,
          <Button key="cancel" onClick={handleModalCancel} disabled={timeLeft <= 0}>
            Cancel
          </Button>
        ]}
        centered
      >
        <p>{timeLeft > 0 ? "" : "Your time for this test has ended. Please submit your answers."}</p>
      </Modal>
    </>
  );
};

export default ExamHeader;