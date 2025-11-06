import React, { useState } from 'react';
import { Button, Modal, List, Tag } from 'antd';

interface Question {
  question: string;
  isAnswered: boolean;
  isCorrect: boolean;
}

interface TestDetailsProps {
  testName: string;
  score: number;
  questions: Question[];
  isTestCompleted: boolean;
  onStartTest: () => void;
}

const TestDetails: React.FC<TestDetailsProps> = ({
  testName,
  score,
  questions,
  isTestCompleted,
  onStartTest,
}) => {
  const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);

  const showSummary = () => {
    setIsSummaryModalVisible(true);
  };

  const hideSummary = () => {
    setIsSummaryModalVisible(false);
  };

  return (
    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-md mb-4">
      {/* Test Name */}
      <div className="font-semibold text-lg">{testName}</div>

      {/* Button for Score or Start Test */}
      {isTestCompleted ? (
        <div className="flex items-center">
          <span className="text-blue-600 font-semibold mr-4">Score: {score}</span>
          <Button className="primary-btn" type="primary" onClick={showSummary}>
            Summary
          </Button>
        </div>
      ) : (
        <Button className="primary-btn" type="primary" onClick={onStartTest}>
          Start Test
        </Button>
      )}

      {/* Summary Modal */}
      <Modal
        title="Test Summary"
        open={isSummaryModalVisible}
        onCancel={hideSummary}
        footer={null}
      >
        <List
          itemLayout="horizontal"
          dataSource={questions}
          renderItem={(item, index) => (
            <List.Item>
              <div className="flex flex-col">
                <div className="font-medium">{`Q${index + 1}: ${item.question}`}</div>
                <div className="mt-1">
                  <Tag color={item.isAnswered ? 'green' : 'red'}>
                    {item.isAnswered ? 'Answered' : 'Unanswered'}
                  </Tag>
                  {item.isAnswered && (
                    <Tag color={item.isCorrect ? 'blue' : 'orange'}>
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </Tag>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
        {/* Display the final score */}
        <div className="text-right font-semibold mt-4">Final Score: {score}</div>
      </Modal>
    </div>
  );
};

export default TestDetails;
