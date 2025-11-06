'use client';
import React, { useEffect, useState } from "react";
import { Button, Space, Modal, Spin, Table, Typography, message } from "antd";
import {
  FileOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import useTestStore from "@/store/evaluate/teststore";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./testDetails.module.css";
import TestDetailsModal from "@/components/evaluate/questionPaperModel";
import ChecklistSection from "@/components/evaluate/checklistSection";
import "antd/dist/reset.css"; // Ant Design styles
// import "@/app/[locale]/evaluate/evaluate.css";
import moment from "moment";
import "@/app/global.css"

import dynamic from "next/dynamic";
import TestDetailsComponent from "@/components/evaluate/summaryOfQuestions";
import AppLayout from "@/components/evaluate/layout";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { IPDFLinkService } from "pdfjs-dist/types/web/interfaces";
dayjs.extend(utc);

const { Text } = Typography;

interface TestDetails {
  test_id: number;
  user_test_id: number;
  test_name: string;
  test_description: string;
  general_data: string | null;
  user_data: string | null;
  video: string | null;
  epi_data: string | null;
  VALIDITY_START: Date;
  VALIDITY_END: Date;
  is_valid: boolean;
  total_marks: number; // User's score
  test_total_marks: number; // Total possible score
  distCount: number;
  distSecs: number;
  modified_date: string;
  user_name: string;
  ip_restriction: number;
  ip_addresses: string;
}

interface Question {
  question: string;
  user_answer?: string;
  correct_answer?: string;
  choice1: string;
  choice2: string;
  choice3?: string;
  choice4?: string;
}

interface ResultData {
  subject: string;
  totalQuestions: number;
  answered: number;
  unanswered: number;
  scoredMarks: number;
  totalScore: number;
  wronganswers: number;
}

const TestDetailsPage: React.FC = () => {
  const { data: session } = useSession();
  const [testDetails, setTestDetails] = useState<TestDetails[]>([]);
  const [summaryData, setSummaryData] = useState<Question[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const setTestId = useTestStore((state) => state.setTestId);
  const setUserTestId = useTestStore((state) => state.setUserTestId);
  const router = useRouter();
  const [data, setData] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [userData, setUserData] = useState<TestDetails | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [isEpiModalVisible, setIsEpiModalVisible] = useState(false);
  const [epiData, setEpiData] = useState<any>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("General Data");
  const [testDate, setTestDate] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [testScore, setTestScore] = useState<number>(0);
  const role = session?.user?.role;
  const userId = session?.user?.email ?? "";
  // const college_code = session?.user?.college_code ?? "";
  const [ip, setip] = useState<string>("");

  useEffect(() => {
    if (session?.user?.role === "ADM") {
      console.log("admin is coming");
      router.push("/evaluate/reviewscreen");
    }
  }, [role]);

  // Handle modal opening with video URL
  const handleVideoDataModal = (
    videoPath: string,
    description: string,
    userId: string,
    modified_date: string
  ) => {
    const fileName = videoPath.split("\\").pop(); // Extract the file name from the full path
    setModalTitle(description);
    userId;
    setTestDate(modified_date);
    if (fileName) {
      setIsVideoModalVisible(true);
    }
  };

  // Handle modal closing
  const handleVideoModalClose = () => {
    setVideoUrl(null); // Clear the video URL
    setIsVideoModalVisible(false); // Hide the modal
  };

  useEffect(() => {
    setIsClient(true);
    console.log("session in test details:", session);
  }, []);

  useEffect(() => {
    const fetchTestDetails = async () => {
      if (session?.user?.id) {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/evaluate/testdetails/v2?userId=${session.user.id}`
          );
          if (response.ok) {
            const data = await response.json();
            // console.log("data coming:", data);
            setTestDetails(data.data);
            setip(data.ip);
            // console.log("data coming1:", data.ip,data.data);
            setLoading(false);
          } else {
            console.error("Failed to fetch test details");
          }
        } catch (error) {
          setLoading(false);
          console.error("Error fetching test details:", error);
        }
      }
    };

    fetchTestDetails();
    console.log("session in test details useeffect:", session);
  }, [session]);

  const handleStartTest = async (
    testId: number,
    userTestId: number,
    generalData: string | null,
    ipRestriction: number,
    ipAddresses: string,
  ) => {
    if (ipRestriction === 1 && ip) {
      try {
        // Convert string to array
        const allowedIPs: string[] = JSON.parse(ipAddresses);

        if (!allowedIPs.includes(ip)) {
          alert('Access denied: You are not on the allowed network.');
          return;
        }
      } catch (err) {
        alert('Could not verify your IP address. Please try again.');
        return;
      }
    }
    console.log("Starting test with ID in handlestart test:", testId);
    console.log("userTestId:", userTestId);
    setTestId(testId.toString());
    setUserTestId(userTestId.toString());
    console.log('setUserTestId  2nd onecalled with:', userTestId);
    if (generalData) {
      router.push(
        `/evaluate/general?testid=${testId}&userTestId=${userTestId}`
      );
    } else {
      router.push(`/evaluate/instructions?testid=${testId}&userTestId=${userTestId}`);
    }
  };
  const handleClick = async (record: any) => {
    if (record.total_marks !== null && record.test_total_marks !== null) {
      try {
        // Await the completion of fetchResults
        await fetchResults(
          record.test_id,
          record.user_test_id,
          record.test_description,
          record.total_marks,
          record.test_total_marks,
          userId,
          record.modified_date
        );
        // Once the fetchResults is complete, set the modal visibility
        setIsResultModalVisible(true);
      } catch (error) {
        console.error("Error fetching results:", error);
        // Optionally, handle error here if needed
      }
    }
  };
  // const handleSummary = async (testId: number, userTestId: number) => {
  //   setLoadingSummary(true);
  //   try {
  //     const response = await fetch(
  //       `/api/evaluate/testdetails/fetchsummary?testId=${testId}&userTestId=${userTestId}`
  //     );
  //     if (response.ok) {
  //       const data = await response.json();
  //       const allAnswerData = data.flatMap((record: any) => {
  //         const parsedAnswerData = JSON.parse(record.answer_data);
  //         return parsedAnswerData.map((item: any) => ({
  //           question: item.question,
  //           user_answer: item.user_answer,
  //           ANSWER: item.ANSWER,
  //           choice1: item.choice1,
  //           choice2: item.choice2,
  //           choice3: item.choice3,
  //           choice4: item.choice4,
  //           subject_id: record.subject_id,
  //         }));
  //       });
  //       setSummaryData(allAnswerData);
  //       setIsModalVisible(true);
  //     } else {
  //       console.error("Failed to fetch summary details");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching summary details:", error);
  //   } finally {
  //     setLoadingSummary(false);
  //   }
  // };


  const handleSummary = async (testId: number, userTestId: number) => {
  setLoadingSummary(true);
  try {
       console.log("Starting test with ID in handlesummary:", testId);
    console.log("userTestId:", userTestId);
      setUserTestId(userTestId.toString());
    const response = await fetch(
      `/api/evaluate/testdetails/fetchsummary?testId=${testId}&userTestId=${userTestId}`
    );
    if (response.ok) {
      const result = await response.json();

      // Defensive: ensure result is an array
      const allAnswerData = result.flatMap((record: any) => {
        // If answer_data is a string, parse it. If it's already an object/array, use as-is.
        let parsedAnswerData: any[] = [];
        try {
          if (typeof record.answer_data === "string") {
            parsedAnswerData = JSON.parse(record.answer_data);
          } else if (record.answer_data == null) {
            parsedAnswerData = [];
          } else {
            // already object/array (jsonb from DB -> parsed by driver)
            parsedAnswerData = record.answer_data;
          }
        } catch (parseErr) {
          console.error("Failed to parse answer_data for record:", record, parseErr);
          parsedAnswerData = []; // skip malformed
        }

        // map each item into the shape you expect
        return parsedAnswerData.map((item: any) => ({
          question: item.question,
          user_answer: item.user_answer,
          ANSWER: item.ANSWER,
          choice1: item.choice1,
          choice2: item.choice2,
          choice3: item.choice3,
          choice4: item.choice4,
          subject_id: record.subject_id,
        }));
      });

      setSummaryData(allAnswerData);
      setIsModalVisible(true);
    } else {
      console.error("Failed to fetch summary details");
    }
  } catch (error) {
    console.error("Error fetching summary details:", error);
  } finally {
    setLoadingSummary(false);
  }
};

  const fetchResults = async (
    testId: number,
    userTestId: number,
    description: string,
    score: number,
    test_score: number,
    userId: string,
    modified_date: string
  ) => {
    setModalTitle(description);
    setScore(score);
    setTestScore(test_score);
    userId;
    setTestDate(modified_date);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/evaluate/results?testId=${testId}&userTestId=${userTestId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const { summary, details } = await response.json();
      setData(details);
      setTotalScore(summary.totalScoredMarks);
    } catch (error) {
      console.error(error);
      message.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleUserDataModal = (
    data: any,
    description: string,
    userId: string,
    modified_date: string
  ) => {
    setUserData(data);
    setModalTitle(description);
    userId;
    setTestDate(modified_date);
    setEpiData(data);
    setIsUserModalVisible(true); // Show the modal
  };
  const handleEpiDataModal = (
    data: any,
    description: string,
    userId: string,
    modified_date: string
  ) => {
    setModalTitle(description);
    userId;
    setTestDate(modified_date);
    setEpiData(data); // Store the epi_data JSON in the state
    setIsEpiModalVisible(true); // Show the modal
  };

  const columnsConfig = [
    { key: "subject", title: "Subject", dataIndex: "subject", visible: true },
    {
      key: "totalQuestions",
      title: "Total Questions",
      dataIndex: "totalQuestions",
      visible: true,
    },
    {
      key: "totalScore",
      title: "Possible Marks",
      dataIndex: "totalScore",
      visible: true,
    },
    {
      key: "answered",
      title: "Answered",
      dataIndex: "answered",
      visible: true,
    },
    {
      key: "unanswered",
      title: "Unanswered",
      dataIndex: "unanswered",
      visible: true,
    },
    {
      key: "wronganswers",
      title: "Wrong Answers",
      dataIndex: "wronganswers",
      visible: true,
    },
    {
      key: "scoredMarks",
      title: "Scored Marks",
      dataIndex: "scoredMarks",
      visible: true,
    },
  ];

  const columns = [
    {
      title: "Test Title",
      dataIndex: "test_description",
      key: "test_description",
    },
    {
      title: "Distraction Data",
      dataIndex: "distraction_data",
      key: "distraction_data",
      render: (_: any, record: TestDetails) => (
        <span
          style={{
            color: record.distCount > 2 ? "orange" : "green",
          }}
        >
          {record.distSecs} seconds   ({record.distCount})
        </span>
      ),
    },
    {
      title: "Test Date",
      dataIndex: "modified_date",
      key: "modified_date",
      render: (date: any) =>
        date ? dayjs.utc(date).format("YYYY-MM-DD hh:mm A") : "",
    },
    {
      title: "General Data",
      dataIndex: "general_data",
      key: "general_data",
      render: (_: any, record: TestDetails) => (
        <span
          style={{
            fontSize: 14,
            cursor: "pointer",
            color: "#1890ff",
          }}
          onClick={() =>
            handleUserDataModal(
              record.user_data,
              record.test_description,
              userId,
              record.modified_date
            )
          }
        >
          View
        </span>
      ),
    },
    {
      title: "EPI Data",
      dataIndex: "epi_data",
      key: "epi_data",
      render: (_: any, record: TestDetails) => (
        <span
          style={{
            fontSize: 14,
            cursor: "pointer",
            color: "#1890ff",
          }}
          onClick={() =>
            handleEpiDataModal(
              record.epi_data,
              record.test_description,
              userId,
              record.modified_date
            )
          }
        >
          View
        </span>
      ),
    },
    {
      title: "Video",
      dataIndex: "video",
      key: "video",
      render: (_: any, record: any) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "#1890ff",
          }}
          onClick={() =>
            handleVideoDataModal(
              record.video,
              record.test_description,
              record.user_id,
              record.modified_date
            )
          }
        >
          <span style={{ marginRight: 5 }}>Video</span>
          <PlayCircleOutlined style={{ fontSize: 18 }} />
        </div>
      ),
    },

    {
      title: "Score",
      dataIndex: "total_marks",
      key: "marks",
      render: (_: number, record: TestDetails) => (
        <div
          style={{
            cursor: "pointer",
            color: "#1890ff",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => handleClick(record)}
        >
          {record.total_marks !== null && record.test_total_marks !== null
            ? `${record.total_marks}/${record.test_total_marks}`
            : "0"}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "is_valid",
      key: "action",
      render: (isValid: boolean, record: TestDetails) => (
        <Space>
          {isValid ? (
            <Button
              type="primary"
              onClick={() => {
                console.log("[Start Test Clicked]", record); // ✅ log the full record
                handleStartTest(
                  record.test_id,
                  record.user_test_id,
                  record.general_data,
                  record.ip_restriction,
                  record.ip_addresses,
                );
              }}
              className={styles.startButton}
            >
              Start Test
            </Button>

          ) : (
            <div
              style={{
                cursor: "pointer",
                color: "#1890ff",
                display: "flex",
                alignItems: "center",
              }}
              
              onClick={async () => {
                await Promise.all([
                  handleSummary(record.test_id, record.user_test_id),
                  fetchResults(
                    record.test_id,
                    record.user_test_id,
                    record.test_description,
                    record.total_marks,
                    record.test_total_marks,
                    userId,
                    record.modified_date
                  ),
                ]);
              }}
            >
              <FileTextOutlined style={{ marginRight: "5px" }} />
              Summary
            </div>
          )}
        </Space>
      ),
    },

  ];

  return (
    <div style={{ padding: '20px' }}>
      <div className='Contentactions-Header' >
        <div className={styles.title}>Available Tests</div>
      </div>
      <Table
        dataSource={testDetails}
        columns={columns}
        rowKey="user_test_id"
        pagination={false}
        loading={loading}
        className={styles.customtable}
      />

      {/* Modal for Test Summary */}

      <Modal
        title={
          <div className={styles.modaltitle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "12px" }}>{modalTitle}</span>
                <small style={{ marginRight: "15px" }}>
                  {testDate ? dayjs.utc(testDate).format("YYYY-MM-DD hh:mm A") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} />{userId}
              </span>
            </div>
          </div>
        }
        open={isResultModalVisible}
        onCancel={() => setIsResultModalVisible(false)}
        footer={null}
        width={Math.max(
          400,
          columnsConfig.filter((col) => col.visible).length * 150
        )}
      >
        <Spin spinning={loading}>
          <div style={{ overflowX: "auto" }}>
            {" "}
            <Table
              dataSource={data}
              columns={columnsConfig.filter((col) => col.visible)}
              rowKey="subject"
              pagination={false}
              className={styles.customtable}
            />
          </div>
          <div
            style={{
              marginTop: "16px",
              fontWeight: "bold",
              color: "grey",
              fontSize: "",
            }}
          >
            Total Score:{score}/ {testScore} <br />
            Percentage : {((score / testScore) * 100).toFixed(2)}%
          </div>
        </Spin>
      </Modal>
      {/* Modal for Test Score */}
      <Modal
        title={
          <div className={styles.modaltitle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "12px" }}>{modalTitle}</span>
                <small style={{ marginRight: "15px" }}>
                  {testDate ? dayjs.utc(testDate).format("YYYY-MM-DD hh:mm A") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} />{userId}
              </span>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={Math.max(
          400,
          columnsConfig.filter((col) => col.visible).length * 150
        )}
      >
        <Spin spinning={loading}>
          <div style={{ overflowX: "auto" }}>
            {" "}
            <Table
              dataSource={data}
              columns={columnsConfig.filter((col) => col.visible)}
              rowKey="subject"
              pagination={false}
              className={styles.customtable}
            />
          </div>
          <div
            style={{
              marginTop: "16px",
              fontWeight: "bold",
              color: "grey",
              fontSize: "",
            }}
          >
            {isModalVisible && (
              <TestDetailsComponent
                data={summaryData}
                showCorrectAnswer={true}
              />
            )}
          </div>
        </Spin>
      </Modal>

      {/* Modal for User Data */}

      <Modal
        title={
          <div className={styles.modaltitle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "12px" }}>{modalTitle}</span>
                <small style={{ marginRight: "15px" }}>
                  {testDate ? dayjs.utc(testDate).format("YYYY-MM-DD hh:mm A") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} />{userId}
              </span>
            </div>
          </div>
        }
        open={isUserModalVisible}
        onCancel={() => setIsUserModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ padding: "16px", maxHeight: "400px", overflowY: "auto" }}>
          {(() => {
            type Field = {
              field_description: string;
              field_group: string;
              value?: string;
            };

            const parsedUserData: Field[] | null = userData
              ? typeof userData === "string"
                ? JSON.parse(userData)
                : userData
              : null;

            if (Array.isArray(parsedUserData)) {
              const groupedData = parsedUserData.reduce<
                Record<string, Field[]>
              >((acc, curr) => {
                const { field_group, field_description, value } = curr;
                if (!acc[field_group]) acc[field_group] = [];
                acc[field_group].push({
                  field_description,
                  field_group,
                  value,
                });
                return acc;
              }, {});
              return Object.entries(groupedData).map(([group, fields]) => (
                <div
                  key={group}
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <h3
                    style={{
                      color: "#6c63ff",
                      fontWeight: "bold",
                      marginBottom: "12px",
                      fontSize: "16px",
                    }}
                  >
                    {group}
                  </h3>
                  <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
                    {fields.map(({ field_description, value }, index) => (
                      <li
                        key={index}
                        style={{
                          marginBottom: "8px",
                          display: "flex",
                          // alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "bold", color: "#333", minWidth: '120px', }}>
                          {field_description}
                        </span>
                        <span style={{ minWidth: '100px', paddingLeft: '42px' }}>:</span>
                        <span
                          style={{
                            color: value ? "#555" : "#aaa",
                            paddingLeft: "10px",
                          }}
                        >
                          {value || ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ));
            } else {
              return (
                <div style={{ color: "red", textAlign: "center" }}>
                  Invalid or empty user data
                </div>
              );
            }
          })()}
        </div>
      </Modal>

      {/* Modal for Video */}
      <Modal
        title={
          <div className={styles.modaltitle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "12px" }}>{modalTitle}</span>
                <small style={{ marginRight: "15px" }}>
                  {testDate ? dayjs.utc(testDate).format("YYYY-MM-DD hh:mm A") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} />{userId}
              </span>
            </div>
          </div>
        }
        open={isVideoModalVisible}
        onCancel={handleVideoModalClose}
        footer={null}
        width={800}
      >
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            style={{ width: "100%", borderRadius: "8px" }}
          />
        )}
      </Modal>

      <Modal
        title={
          <div className={styles.modaltitle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: "12px" }}>{modalTitle}</span>
                <small style={{ marginRight: "15px" }}>
                  {testDate ? dayjs.utc(testDate).format("YYYY-MM-DD hh:mm A") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} />{userId}
              </span>
            </div>
          </div>
        }
        open={isEpiModalVisible}
        onCancel={() => setIsEpiModalVisible(false)}
        footer={null}
        width="100%"
      >
        {(() => {
          const parsedEpiData = epiData
            ? typeof epiData === "string"
              ? JSON.parse(epiData)
              : epiData
            : null;
          if (Array.isArray(parsedEpiData)) {
            const selectedValues = parsedEpiData.reduce((acc, item) => {
              acc[item.id] = item.selected;
              return acc;
            }, {});

            const sections = parsedEpiData.reduce((acc, item) => {
              if (!acc[item.section]) {
                acc[item.section] = [];
              }
              acc[item.section].push(item);
              return acc;
            }, {});
            return Object.keys(sections).map((section) => (
              <ChecklistSection
                key={section}
                section={section}
                questions={sections[section]}
                selectedValues={selectedValues}
                onSliderChange={() => { }}
                editable={false}
              />
            ));
          } else {
            return <Text>Invalid or empty EPI data</Text>;
          }
        })()}
      </Modal>
    </div>

  );
};

export default TestDetailsPage;
