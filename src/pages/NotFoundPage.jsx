import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleBackHome = () => {
        navigate('/dashboard'); // Change to '/' if you want to navigate to the home page
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh', // Full viewport height
                backgroundColor: '#f0f2f5', // Optional background color
            }}
        >
            <Result
                status="404"
                title="404"
                subTitle="This website is not supported on that page."
                extra={
                    <Button type="primary" onClick={handleBackHome}>
                        Back Home
                    </Button>
                }
            />
        </div>
    );
};

export default NotFoundPage;