"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Spin, Input } from "antd";
import styles from "./questionbank.module.css";

interface AiQuestion {
  id: number;
  question: string;
  options: string[];
  correct_ans: string;
  status: number;
  deleted: number;
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<AiQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const pageSize = 10;

  // Filter questions based on search text
  const filteredQuestions = questions.filter((question) =>
    question.question.toLowerCase().includes(searchText.toLowerCase())
  );

  const createQuestionPaper = async () => {
    if (selectedRows.length === 0) {
      setModalMessage("Please select at least one question to save to database.");
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      // Send questions to EVAL_QUESTIONS table
      const evalQuestionsData = selectedRows.map((question) => {
        // Parse options
        let opts = question.options;
        if (typeof opts === "string") {
          try {
            opts = JSON.parse(opts);
          } catch {
            opts = [];
          }
        }

        // Get options as array
        const optionsArray = Array.isArray(opts) ? opts : [];
        
        return {
          SUBJECT_ID: 1,
          TOPIC_ID:2, 
          QUESTION_NUMBER: question.id.toString(),
          QUESTION: question.question,
          CHOICE1: optionsArray[0] || "",
          CHOICE2: optionsArray[1] || "",
          CHOICE3: optionsArray[2] || "",
          CHOICE4: optionsArray[3] || "",
          ANSWER: question.correct_ans,
          OPTIONS: JSON.stringify(optionsArray),
          CREATED_DATE: new Date(),
          QUESTION_TYPE: "MCQ"
        };
      });

      // Send to EVAL_QUESTIONS API
      const evalResponse = await fetch("/api/palms/eval-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: evalQuestionsData
        }),
      });

      if (!evalResponse.ok) {
        console.error("Failed to save to EVAL_QUESTIONS");
        setModalMessage("Failed to save questions to database.");
        setModalVisible(true);
      } else {
        console.log("Successfully saved to EVAL_QUESTIONS");
        setModalMessage(`Successfully saved ${selectedRows.length} questions to database.`);
        setModalVisible(true);
        // Clear selection after successful save
        setSelectedRowKeys([]);
        setSelectedRows([]);
      }

    } catch (error) {
      console.error("Error saving to database:", error);
      setModalMessage("Error saving questions to database. Please try again.");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/palms/questionbank");
        const data = await res.json();

        console.log('Question Bank: ', data);

        const flatData = data.flatMap((parent: any) => [
          {
            ...parent,
            question: parent.question,
            options: parent.options,
            correct_ans: parent.correct_ans,
            status: parent.status,
            deleted: parent.deleted,
          },
          ...parent.changes.map((change: any) => ({
            ...change,
            deleted: parent.deleted,
          })),
        ]);

        setQuestions(flatData);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      }
    };
    fetchQuestions();
  }, []);

  const columns = [
    {
      title: "S.No.",
      key: "sno",
      width: 60,
      render: (_: any, record: AiQuestion, idx: number) => {
        // Calculate global index based on current page and page size
        const globalIndex = (currentPage - 1) * pageSize + idx + 1;
        return globalIndex;
      },
      className: styles.column,
    },
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      width: 700,
      className: styles.column,
    },
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      width: 250,
      render: (_: any, record: AiQuestion) => {
        let opts = record.options;
        if (typeof opts === "string") {
          try {
            opts = JSON.parse(opts);
          } catch {
            opts = [];
          }
        }
        return Array.isArray(opts) && opts.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {opts.map((opt: string, idx: number) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
        ) : (
          <span>No options</span>
        );
      },
      className: styles.column,
    },
    {
      title: "Correct Answer",
      dataIndex: "correct_ans",
      key: "correct_ans",
      className: styles.column,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: [
        { text: "Approved", value: 1 },
        { text: "Pending", value: 0 },
        { text: "Rejected", value: -1 },
      ],
      filterSearch: true,
      onFilter: (value: any, record: AiQuestion) => {
        if (value === -1) return record.deleted === 1;
        if (value === 1) return record.status === 1 && record.deleted !== 1;
        if (value === 0) return record.status === 0 && record.deleted !== 1;
        return false;
      },
      render: (_: number, record: AiQuestion) => {
        if (record.deleted === 1) {
          return <Tag color="red">Rejected</Tag>;
        }
        return record.status === 1 ? (
          <Tag color="green">Approved</Tag>
        ) : (
          <Tag color="orange">Pending</Tag>
        );
      },
      className: styles.column,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div>
        <div className="MainTitle">Question Bank</div>
      </div>
      
      {/* Search Input */}
      <div style={{ padding: '16px 0' }}>
        <Input.Search
          placeholder="Search questions..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        {searchText && (
          <span style={{ marginLeft: 8, color: '#666' }}>
            Found {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {selectedRows.length > 0 && (
            <b>
              Selected: {selectedRowKeys.length}
              <span>
                (
                  {selectedRows
                    .map(row => questions.findIndex(q => q.id === row.id) + 1)
                    .join(", ")}
                )
              </span>
            </b>
          )}
        </div>
                 {selectedRows.length > 0 && (
           <Button 
             type="primary" 
             onClick={createQuestionPaper}
             loading={loading}
             style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
           >
             {loading ? "Saving..." : "Save to Database"}
           </Button>
         )}
      </div>
      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows as AiQuestion[]);
          },
        }}
        className={styles.table}
        columns={columns}
        dataSource={filteredQuestions}
        rowKey="id"
        pagination={{ 
          pageSize: pageSize,
          current: currentPage,
          onChange: (page) => setCurrentPage(page)
        }}
                 bordered
       />
       
       <Modal
         title="Question Bank"
         open={modalVisible}
         onOk={() => setModalVisible(false)}
         onCancel={() => setModalVisible(false)}
         footer={[
           <Button key="ok" type="primary" onClick={() => setModalVisible(false)}>
             OK
           </Button>
         ]}
       >
         <p>{modalMessage}</p>
       </Modal>
     </div>
   );
 }
