
import React, { useEffect, useState } from "react";
import { Layout, Card, Table, Typography, Spin, Divider, Button, message } from "antd";
import axios from "axios";
import styles from "@/app/[locale]/evaluate/testdetails/testDetails.module.css";
import "@/app/global.css"

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const TestSummary: React.FC<{ testId: string }> = ({ testId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<{ totalQuestions: number; totalScore: number } | null>(null);

  const columns = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Total Questions",
      dataIndex: "totalQuestions",
      key: "totalQuestions",
    },
    {
      title: "Total Marks",
      dataIndex: "totalScore",
      key: "totalScore",
    },
    {
      title: "Time",
      dataIndex: "Time",
      key: "Time",
    },
    {
      title: "Topics",
      dataIndex: "topicNames",
      key: "topicNames",
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/evaluate/instructions?testId=${testId}`);
      console.log("API response:", response.data);
      const { summary, details } = response.data;
      setSummary(summary);
      setData(details);
    } catch (error) {
      message.error("Failed to load test summary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [testId]);

  return (
    <Layout >
      {/* <Content> */}
        <div style={{backgroundColor:'#F5EFF5'}}>
          <div className="Content-Compiler-Header">
          </div>
          {loading ? (
            <Spin
              size="large"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

              }}
            />
          ) : (
            <>
              <div className="Table-One-Div-Appli">
                <Table
                  columns={columns}
                  dataSource={data}
                  pagination={false}
                  bordered
                  className={styles.customtable}

                />
              </div>
              <Divider />
              <div className="MainTitle">Test Instructions</div>
              <Paragraph>
                <ol>
                  <li style={{ padding: "4px" }}>
                    DO NOT START ANSWERING UNTIL THE TIMER FOR THE SECTION BEGINS.
                  </li>
                  <li style={{ padding: "4px" }}>
                    Ensure you are in a quiet environment with minimal distractions while attempting the test.
                  </li>
                  <li style={{ padding: "4px" }}>
                    Carefully read each question before selecting an answer, especially in the MCQ and grammar sections.
                  </li>
                  <li style={{ padding: "4px" }}>
                    For the listening section, use headphones or ensure your speakers are set to a comfortable volume level.
                  </li>
                  <li style={{ padding: "4px" }}>
                    In the writing section, take your time to organize your thoughts before typing your response. Proper grammar, spelling, and structure will be evaluated.
                  </li>
                  <li style={{ padding: "4px" }}>
                    In the grammar section, choose the most grammatically correct option. Be mindful of punctuation, verb tenses, and sentence structure.
                  </li>
                  <li style={{ padding: "4px" }}>
                    There is NO TIME LIMIT for answering individual questions, but be mindful of the overall time for that section.
                  </li>
                  <li style={{ padding: "4px" }}>
                    You can revisit and change your answers for MCQs until the test ends. However, once you submit your writing section, it cannot be edited.
                  </li>
                  <li style={{ padding: "4px" }}>
                    Ensure that your answers are well thought out. For writing responses, avoid using abbreviations or informal language unless specified.
                  </li>
                  <li style={{ padding: "4px" }}>
                    If you encounter any issues with the test platform, contact the support team immediately, but do not interrupt the testing process unless necessary.
                  </li>
                </ol>

              </Paragraph>

            </>
          )}
        </div>
      {/* </Content> */}
    </Layout>
  );
};

export default TestSummary;
