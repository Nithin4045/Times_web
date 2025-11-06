"use client";

import React, { useEffect, useState } from "react";
import { Slider, Button, Table, Row, Col } from "antd";
import { createTimeModel, useTimeModel } from "react-compound-timer";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useTestStore from "@/store/evaluate/teststore";
import AppLayout from "@/components/evaluate/layout";
import styles from "./checklist.module.css";
let timer: any;
if (typeof window !== "undefined") {
  timer = createTimeModel({
    initialTime: 600000,
    direction: "backward",
  });
}

const Checklist = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { testId } = useTestStore();
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: number | typeof NaN;
  }>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!testId) {
        return "Test ID is missing.";
      }

      try {
        const response = await fetch(
          `/api/evaluate/checklist?test_id=${testId}`
        );
        if (response.ok) {
          const data = await response.json();
          const fetchedQuestions = data.questions[0]?.question || [];
          if (typeof fetchedQuestions === "string") {
            try {
              const parsedQuestions = JSON.parse(fetchedQuestions);
              if (Array.isArray(parsedQuestions)) {
                setQuestions(parsedQuestions);
              } else {
                console.error(
                  "Parsed questions are not in the expected array format."
                );
              }
            } catch (error) {
              return error;
            }
          } else if (Array.isArray(fetchedQuestions)) {
            setQuestions(fetchedQuestions);
          } else {
            console.error(
              "Fetched questions are not an array or a valid string."
            );
          }
        } else {
          return response.statusText;
        }
      } catch (error) {
        return error;
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [testId]);

  const handleSliderChange = (id: string, value: number | null) => {
    console.log("Slider Change:", { id, value });
    setSelectedValues((prevValues) => ({
      ...prevValues,
      [id]: value ?? NaN,
    }));
  };
  const handleSubmit = async () => {
    if (!userId || !testId) {
      console.error("Email or Test ID is missing.");
      alert("Please ensure you are logged in and have selected a valid test.");
      return;
    }
    console.log("Selected Values:", selectedValues);
    const qns = questions.map((q) => ({
      ...q,
      selected: selectedValues[q.id] ?? NaN,
    }));

    try {
      const response = await fetch("/api/evaluate/checklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          test_id: testId,
          data: { qns },
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        console.log(resData.message);
        router.push("/evaluate/video");
        // fetchLinkedTestDetails();
        
      } else {
        console.error("Error submitting data:", response.statusText);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    }
  };

  const uniqueSections = Array.from(
    new Set(questions.map((item) => item.section))
  );
  const fetchLinkedTestDetails = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/evaluate/getlinkedtest?user_id=${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        return;
      }

      const data = await response.json();
      if (data && data.linkedTestDetails && Array.isArray(data.linkedTestDetails) && data.linkedTestDetails.length > 0) {
        const testDetails = data.linkedTestDetails[0]; 
        console.log("this is my data of linked test", testDetails);

        const { TEST_ID, TEST_TYPE, TEST_DESCRIPTION } = testDetails;

        
        const queryParams = new URLSearchParams({
          TEST_ID: String(TEST_ID),
          TEST_TYPE: TEST_TYPE,
          TEST_TITLE: TEST_DESCRIPTION,
        }).toString();

        const url = `/codecompiler/home/test-pattern?${queryParams}`;
        router.push(url); 
      } else {
        router.push("/evaluate/video");
      }
      if (data && data.linkedTestDetails) {
        console.log('this is my data',data)
        console.log('this is my data of linked test',data.linkedTestDetails)
      } else {
        console.log("No linked test details found.");
      }
    } catch (err) {
      console.log("Error fetching linked test: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles["sticky-header"]}>
          <Row justify="space-between" align="middle">
            <Col style={{ textAlign: "left" }}>
              <TimerComponent onComplete={handleSubmit} />
            </Col>
            <Col style={{ textAlign: "right" }}>
              <Button
                className={styles["submit-button"]}
                onClick={handleSubmit}
              >
                Submit Answers
              </Button>
            </Col>
          </Row>
        </div>

        <div className={styles["table-container"]}>
          {uniqueSections.map((section) => (
            <div key={section} className={styles["question-section"]}>
              <h2
                className={styles["section-heading"]}
              >{`PRAGMATIQ PERSONALITY INVENTORY - ${section}`}</h2>
              <Table
                size="small"
                dataSource={questions.filter((q) => q.section === section)}
                pagination={false}
                rowClassName={styles["question-row"]}
                rowKey="id"
                showHeader={false}
              >
                <Table.Column
                  dataIndex="question"
                  key="question"
                  render={(text) => (
                    <div className={styles["question-text"]}>{text}</div>
                  )}
                />
                <Table.Column
                  render={(text, qn) => (
                    <div className={styles["slider-container"]}>
                      <Slider
                        id={`Sl_${qn.id}`}
                        marks={qn.scale.reduce((acc: any, mark: any) => {
                          acc[mark.value] = mark.label || mark.value;
                          return acc;
                        }, {})}
                        min={qn.scaleMin}
                        max={qn.scaleMax}
                        step={null}
                        style={{ width: "350px" }}
                        trackStyle={{ backgroundColor: "blue" }}
                        handleStyle={{
                          borderColor: "blue",
                          backgroundColor: "blue",
                        }}
                        railStyle={{ backgroundColor: "lightblue" }}
                        value={selectedValues[qn.id] ?? null}
                        onChange={(value) =>
                          handleSliderChange(qn.id.toString(), value)
                        }
                      />
                    </div>
                  )}
                />
              </Table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
interface TimerComponentProps {
  onComplete: () => void;
}

const TimerComponent: React.FC<TimerComponentProps> = ({ onComplete }) => {
  const { value } = useTimeModel(timer);

  useEffect(() => {
    if (value.h === 0 && value.m === 0 && value.s === 0) {
      onComplete();
    }
  }, [value.h, value.m, value.s, onComplete]);

  return (
    <div className={styles["timer-text"]}>
      Remaining: {value.h} HH {value.m} MM {value.s} SS
    </div>
  );
};

export default Checklist;
