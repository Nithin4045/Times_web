"use client";
import React, { useEffect, useState } from "react";
import { Button, Modal, Input, Space, Table, Tabs, Spin } from "antd";
import styles from "./reviewscreen.module.css";
import { FileTextOutlined, PlayCircleOutlined, UserOutlined } from "@ant-design/icons";
import moment from "moment";
import ChecklistSection from "@/components/evaluate/checklistSection";
import TestDetailsComponent from "@/components/evaluate/summaryOfQuestions";
import AppLayout from "@/components/evaluate/layout";
import { useSession } from "next-auth/react";

interface ReviewRecord {
  test_id: string;
  user_test_id: string;
  test_description: string;
  user_id: string;
  test_name: string;
  general_data: string | null;
  user_data: string | null;
  video: string;
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
}

interface Question {
  subject_id: string;
  question: string;
  user_answer: string;
  marks: number;
  ANSWER?: string;
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
const ReviewScreen = () => {
  const [pendingReviews, setPendingReviews] = useState<ReviewRecord[]>([]);
  const { data: session } = useSession();
  const [reviewedReviews, setReviewedReviews] = useState<ReviewRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(
    null
  );
  const [marksData, setMarksData] = useState<Record<string, number>>({});
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [summaryData, setSummaryData] = useState<Question[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const [isEpiModalVisible, setIsEpiModalVisible] = useState(false);
  const [epiData, setEpiData] = useState<any>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("General Data");
  const [testDate, setTestDate] = useState<string>("");
  const [user_id, setUser_Id] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [testScore, setTestScore] = useState<number>(0);
  const [userData, setUserData] = useState<ReviewRecord | null>(null);
  const [data, setData] = useState<ResultData[]>([]);
  const userId = session?.user?.email;
  useEffect(() => {
    fetch("/api/evaluate/reviewscreen")
      .then((response) => response.json())
      .then((data) => {
        setPendingReviews(data.pendingReviews);
        setReviewedReviews(data.reviewedReviews);
      })
      .catch((error) => console.error("Error fetching review data:", error));
  }, [refreshFlag]);

  const fetchQuestions = (testId: string, userTestId: string) => {
    fetch(
      `/api/evaluate/reviewquestions?test_id=${testId}&user_test_id=${userTestId}`
    )
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data.questions);
        setModalVisible(true);
      })
      .catch((error) => console.error("Error fetching questions:", error));
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
          record.user_id,
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
  const handleSummary = async (testId: string, userTestId: string) => {
    setLoadingSummary(true);
    try {
      const response = await fetch(
        `/api/evaluate/testdetails/fetchsummary?testId=${testId}&userTestId=${userTestId}`
      );
      if (response.ok) {
        const data = await response.json();
        const allAnswerData = data.flatMap((record: any) => {
          const parsedAnswerData = JSON.parse(record.answer_data);
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
    testId: string,
    userTestId: string,
    description: string,
    score: number,
    test_score: number,
    user_id: string,
    modified_date: string
  ) => {
    setModalTitle(description);
    setScore(score);
    setTestScore(test_score);
    setUser_Id(user_id);
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
      console.log("this is for wrong answers", details);
      setData(details); // Includes `wrongAnswers` in details
      setTotalScore(summary.totalScoredMarks);
    } catch (error) {
      console.error(error);
      // message.error("Failed to load results");
    } finally {
      setLoading(false);
    }
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
  const handleEpiDataModal = (
    data: any,
    description: string,
    user_id: string,
    modified_date: string
  ) => {
    setModalTitle(description);
    setUser_Id(user_id);
    setTestDate(modified_date);
    setEpiData(data); // Store the epi_data JSON in the state
    setIsEpiModalVisible(true); // Show the modal
  };
  const handleVideoDataModal = (
    videoPath: string,
    description: string,
    user_id: string,
    modified_date: string
  ) => {
    const fileName = videoPath.split("\\").pop(); // Extract the file name from the full path
    setModalTitle(description);
    setUser_Id(user_id);
    setTestDate(modified_date);
    if (fileName) {
      // setVideoUrl(`/api/evaluate/video/${fileName}`); // Generate the API URL
      setVideoUrl(`/api/evaluate/video/videosdisp/${fileName}`);
      setIsVideoModalVisible(true); // Show the modal
    }
  };

  // Handle modal closing
  const handleVideoModalClose = () => {
    setVideoUrl(null); // Clear the video URL
    setIsVideoModalVisible(false); // Hide the modal
  };
  const handleUserDataModal = (
    user_data: any,
    description: string,
    user_id: string,
    modified_date: string
  ) => {
    setUserData(user_data); // Store the user_data JSON in the state
    setModalTitle(description);
    setUser_Id(user_id);
    setTestDate(modified_date);
    setIsUserModalVisible(true); // Show the modal
  };
  const handleReview = (record: ReviewRecord, description: string,
    user_id: string,
    modified_date: string) => {
    setSelectedReview(record);
    setModalTitle(description);
    setUser_Id(user_id);
    setTestDate(modified_date);
    fetchQuestions(record.test_id, record.user_test_id, );
  };

  const handleMarksChange = (subjectId: string, value: number) => {
    setMarksData((prev) => ({ ...prev, [subjectId]: value }));
  };

  const updateMarks = () => {
    let totalMarks = 0;
    const subjectIds: string[] = [];
    const marks: number[] = [];

    questions.forEach((q) => {
      totalMarks += marksData[q.subject_id] || 0;
      subjectIds.push(q.subject_id);
      marks.push(marksData[q.subject_id] || 0);
    });

    const { test_id, user_test_id } = selectedReview!;

    // Post the data to backend
    fetch("/api/evaluate/reviewquestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_id,
        user_test_id,
        marks,
        subject_id: subjectIds, // Send all subject_ids
        userId
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setModalVisible(false);
        setRefreshFlag((prev) => !prev);
      })
      .catch((error) => console.error("Error updating marks:", error));
  };

  const columns = [
    {
      title: "Test Description",
      dataIndex: "test_description",
      key: "test_description",
    },
    { title: "User ID", dataIndex: "user_id", key: "user_id" },
    {
      title: "Test Date",
      dataIndex: "modified_date",
      key: "modified_date",
      render: (date: any) =>
        date ? moment(date).format("YYYY-MM-DD HH:mm") : "",
    },
    {
      title: "Distraction Data",
      dataIndex: "distraction_data",
      key: "distraction_data",
      render: (_: any, record: ReviewRecord) => (
        <span
          style={{
            color: record.distCount > 2 ? "orange" : "green",
            // fontWeight: record.distCount > 2 ? 'bold' : 'normal',
          }}
        >
          Distracted {record.distCount} times for {record.distSecs} seconds
        </span>
      ),
    },
    
    {
      title: "General Data",
      dataIndex: "general_data",
      key: "general_data",
      render: (_: any, record: ReviewRecord) => (
        <span
          style={{
            fontSize: 14,
            cursor: "pointer",
            color: "#1890ff",
            textDecoration: "underline",
          }}
          onClick={() =>
            handleUserDataModal(
              record.user_data,
              record.test_description,
              record.user_id,
              record.modified_date
            )
          } // Pass user_data and test_description
        >
          View
        </span>
      ),
    },
    {
      title: "EPI Data",
      dataIndex: "epi_data",
      key: "epi_data",
      render: (_: any, record: ReviewRecord) => (
        <span
          style={{
            fontSize: 14,
            cursor: "pointer",
            color: "#1890ff",
            textDecoration: "underline",
          }}
          onClick={() =>
            handleEpiDataModal(
              record.epi_data,
              record.test_description,
              record.user_id,
              record.modified_date
            )
          } // Pass epi_data JSON
        >
          View
        </span>
      ),
    },
    {
      title: "Video",
      dataIndex: "video",
      key: "video",
      render: (_: any, record: ReviewRecord) => (
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
          } // Pass video path
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
      render: (_: number, record: ReviewRecord) => (
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
      title: "Summary",
      dataIndex: "summary",
      key: "summary",
      render: (isValid: boolean, record: ReviewRecord) => (
        <Space>
           
            <div
              style={{
                cursor: "pointer",
                color: "#1890ff",
                display: "flex",
                alignItems: "center",
              }}
              onClick={async () => {
                // Call both functions simultaneously
                await Promise.all([
                  handleSummary(record.test_id, record.user_test_id),
                  fetchResults(
                    record.test_id,
                    record.user_test_id,
                    record.test_description,
                    record.total_marks,
                    record.test_total_marks,
                    record.user_id,
                    record.modified_date
                  ),
                ]);
              }}
            >
              <FileTextOutlined style={{ marginRight: "5px" }} />
              Summary
            </div>
          
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ReviewRecord) => (
        <Space>
          {activeTab === "pending" && (
            <Button className="primary-btn" type="primary" onClick={() => handleReview(record,record.test_description,
              record.user_id,
              record.modified_date)}>
              Review
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
  
      <div className={styles.maincontainer}>
      <h2 className={styles.title}>
        Evaluate Reviews
      </h2>
      {/* <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mt-4"
        items={[
          {
            key: "pending",
            label: "Pending Reviews",
            children: (
              <Table
                dataSource={pendingReviews}
                columns={columns}
                rowKey="user_test_id"
              />
            ),
          },
          {
            key: "reviewed",
            label: "Reviewed Reviews",
            children: (
              <Table
                dataSource={reviewedReviews}
                columns={columns}
                rowKey="user_test_id"
              />
            ),
          },
        ]}
      /> */}

<Tabs
  activeKey={activeTab}
  onChange={setActiveTab}
  className="mt-4"
  items={[
    {
      key: "pending",
      label: (
        <span
          className={`${styles.tabLabel} ${activeTab === "pending" ? styles.selectedTab : styles.unselectedTab}`}
        >
          Pending Reviews
        </span>
      ),
      children: (
        <Table
          dataSource={pendingReviews}
          columns={columns}
          rowKey="user_test_id"
          className={styles.reviewtable}
        />
      ),
    },
    {
      key: "reviewed",
      label: (
        <span
          className={`${styles.tabLabel} ${activeTab === "reviewed" ? styles.selectedTab : styles.unselectedTab}`}
        >
          Reviewed Reviews
        </span>
      ),
      children: (
        <Table
          dataSource={reviewedReviews}
          columns={columns}
          rowKey="user_test_id"
          className={styles.reviewtable}
        />
      ),
    },
  ]}
/>

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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
              </span>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className={styles.modal}
        styles={{
          body: {
            padding: 0,
            height: "100%",
            width: "100%",
            overflowY: "auto",
          },
        }}
        centered={false}
      >
        <div>
          {/* Table Component */}
          <Table
            dataSource={questions.map((question, index) => ({
              key: index,
              
              question: (
                <>
                  <p className={styles.questionText}>{question.question}</p>
                  <p>
                    <strong>User Answer:</strong>{" "}
                    <span className={styles.userAnswer}>
                      {question.user_answer}
                    </span>
                  </p>
                </>
              ),
              marks: (
                <Input
                  type="number"
                  placeholder="Enter marks"
                  value={marksData[question.subject_id] || ""}
                  onChange={(e) =>
                    handleMarksChange(
                      question.subject_id,
                      parseInt(e.target.value || "0")
                    )
                  }
                />
              ),
            }))}
            columns={[
              {
                title: "Questions",
                dataIndex: "question",
                key: "question",
              },
              {
                title: "Marks",
                dataIndex: "marks",
                key: "marks",
              },
            ]}
            pagination={false}
            className={styles.reviewtable}
          />

          {/* Update Button */}
          <div className={styles.footer}>
            <Button
              type="primary"
              onClick={updateMarks}
              className={styles.updateButton}
              style={{ float: "right", marginTop: "20px" }}
            >
              Update Marks
            </Button>
          </div>
        </div>
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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
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
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "bold", color: "#333" }}>
                          {field_description}:
                        </span>
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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
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
          // Parse the epiData only inside the modal render block
          const parsedEpiData = epiData
            ? typeof epiData === "string"
              ? JSON.parse(epiData)
              : epiData
            : null;

          // Check if parsedEpiData is valid and an array
          if (Array.isArray(parsedEpiData)) {
            // Create an object to store selected values by question id
            const selectedValues = parsedEpiData.reduce((acc, item) => {
              // Store the selected value for each question by its id
              acc[item.id] = item.selected;
              return acc;
            }, {});

            // Group questions by section
            const sections = parsedEpiData.reduce((acc, item) => {
              if (!acc[item.section]) {
                acc[item.section] = [];
              }
              acc[item.section].push(item);
              return acc;
            }, {});

            // Render each section with the ChecklistSection component
            return Object.keys(sections).map((section) => (
              <ChecklistSection
                key={section}
                section={section}
                questions={sections[section]}
                selectedValues={selectedValues} // Pass the selected values here
                onSliderChange={() => {}} // No need for onSliderChange in non-editable mode
                editable={false} // Pass false to make it non-editable
              />
            ));
          } else {
            return <p>Invalid or empty EPI data</p>;
          }
        })()}
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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
              </span>
            </div>
          </div>
        }
        open={isResultModalVisible}
        onCancel={() => setIsResultModalVisible(false)}
        footer={null}
        width={Math.max(
          400,
          columnsConfig.filter((col:any) => col.visible).length * 150
        )}
      >
        <Spin spinning={loading}>
          <div style={{ overflowX: "auto" }}>
            {" "}
            {/* Add horizontal scroll */}
            <Table
              dataSource={data}
              columns={columnsConfig.filter((col:any) => col.visible)} // Includes `wrongAnswers`
              rowKey="subject"
              pagination={false}
              className={styles.reviewtable}
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
                  {testDate ? moment(testDate).format("YYYY-MM-DD HH:mm") : ""}
                </small>
              </div>

              <span style={{ display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: "4px" }} /> :{user_id}
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
            {/* Add horizontal scroll */}
            <Table
              dataSource={data}
              columns={columnsConfig.filter((col) => col.visible)} // Includes `wrongAnswers`
              rowKey="subject"
              pagination={false}
              className={styles.reviewtable}
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
    </div>
  );
};

export default ReviewScreen;
