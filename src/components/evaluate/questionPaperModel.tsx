import React from "react";
import { Modal, Typography } from "antd";

const { Text } = Typography;

type Question = {
  question: string;
  user_answer?: string;
  ANSWER?: string;
  choice1: string;
  choice2: string;
  choice3?: string;
  choice4?: string;
};

type TestDetailsModalProps = {
  isVisible: boolean;
  onClose: () => void;
  data: Question[];
  title?: string;
  showCorrectAnswer?: boolean; // Conditional flag for displaying the correct answer
};

const TestDetailsModal: React.FC<TestDetailsModalProps> = ({
  isVisible,
  onClose,
  data,
  title = "Test Details",
  showCorrectAnswer = false,
}) => {
  const renderChoices = (question: Question, userAnswer?: string) => {
    const choices = [
      { label: "a)", choice: question.choice1 },
      { label: "b)", choice: question.choice2 },
      { label: "c)", choice: question.choice3 },
      { label: "d)", choice: question.choice4 },
    ];

    return (
      <div style={{ margin: "10px 0" }}>
        {choices
          .filter((choice) => choice.choice) // Filter out undefined choices
          .map((choice, index) => (
            <Text
              key={index}
              type={choice.choice === userAnswer ? "warning" : undefined} // Highlight user's choice
              style={{ display: "block" }}
            >
              {`${choice.label} ${choice.choice}`}
            </Text>
          ))}
      </div>
    );
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {data.map((question, index) => (
        <div
          key={index}
          style={{
            marginBottom: "20px",
            padding: "10px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Text strong>{`Q${index + 1}: ${question.question}`}</Text>
          {renderChoices(question, question.user_answer)}
          {question.user_answer ? (
                question.user_answer === question.ANSWER ? (
                  <Text type="success">{`Your Answer: ${question.user_answer}`}</Text>
                ) : (
                  <Text type="danger">{`Your Answer: ${question.user_answer}`}</Text>
                )
              ) : (
                <Text type="warning">No Answer Provided</Text>
              )}
          <br />
          {showCorrectAnswer && question.ANSWER && (
            <>
            <Text style={{fontWeight:"500",color:"grey"}} type="secondary">{`Correct Answer: ${question.ANSWER}`}</Text>
              
            </>
          )}
        </div>
      ))}
    </Modal>
  );
};

export default TestDetailsModal;
