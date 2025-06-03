import React from 'react';
import { Table } from 'antd';

const MockExam = () => {
    const listeningData = [
        { key: '1', question: 'Question 1', answer: 'Answer 1', score: 10 },
        { key: '2', question: 'Question 2', answer: 'Answer 2', score: 8 },
    ];

    const readingData = [
        { key: '1', question: 'Question 1', answer: 'Answer 1', score: 9 },
        { key: '2', question: 'Question 2', answer: 'Answer 2', score: 7 },
    ];

    const speakingData = [
        { key: '1', question: 'Question 1', answer: 'Answer 1', score: 8 },
        { key: '2', question: 'Question 2', answer: 'Answer 2', score: 6 },
    ];

    const columns = [
        { title: 'Question', dataIndex: 'question', key: 'question' },
        { title: 'Answer', dataIndex: 'answer', key: 'answer' },
        { title: 'Score', dataIndex: 'score', key: 'score' },
    ];

    return (
        <div>
            <h1>Mock Exam</h1>
            <section>
                <h2>Listening</h2>
                <Table dataSource={listeningData} columns={columns} pagination={false} />
            </section>

            {/* Reading Table */}
            <section>
                <h2>Reading</h2>
                <Table dataSource={readingData} columns={columns} pagination={false} />
            </section>

            {/* Speaking Table */}
            <section>
                <h2>Speaking</h2>
                <Table dataSource={speakingData} columns={columns} pagination={false} />
            </section>
        </div>
    );
};

export default MockExam;
