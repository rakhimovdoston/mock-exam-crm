import React, { useEffect, useState } from 'react';
import { Layout, Button } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Header } = Layout;

const ExamHeader = ({type}) => {
  const [timeLeft, setTimeLeft] = useState(type === 'reading' ? 60 * 60 : 35 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Header style={{ textAlign: 'center', position: 'sticky', top: 0, background: "white", boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)"}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{fontSize: "20px", fontWeight: 700}}>{type === "reading" ? "Reading Test" : "Listening Test"}</span>
        <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClockCircleOutlined style={{ fontSize: '16px' }} />
          {formatTime(timeLeft)}
        </span>
        <Button type="primary" style={{ fontWeight: 'bold' }}>
          Submit
        </Button>
      </div>
    </Header>
  );
};

export default ExamHeader;