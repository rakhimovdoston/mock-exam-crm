import React, { useState, useEffect } from 'react';
import { Card, Button } from 'antd';

const UserPage = () => {
    const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours in seconds

    // Countdown timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);

        return () => clearInterval(timer); // Cleanup timer on component unmount
    }, []);

    // Format time in HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return ( 
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'Arial, sans-serif',
            }}
        >
            <h2 style={{ marginBottom: '20px' }}>Time Remaining: {formatTime(timeLeft)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                {/* Listening Card */}
                <Card title="Listening" style={{ width: 600 }}>
                    <p>Practice your listening skills.</p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button type="primary">Start</Button>
                    </div>
                </Card>

                {/* Reading Card */}
                <Card title="Reading" style={{ width: 600 }}>
                    <p>Practice your reading skills.</p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button type="primary">Start</Button>
                    </div>
                </Card>

                {/* Writing Card */}
                <Card title="Writing" style={{ width: 600 }}>
                    <p>Practice your writing skills.</p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button type="primary">Start</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default UserPage;