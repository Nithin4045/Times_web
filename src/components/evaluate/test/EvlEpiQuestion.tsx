"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table, Button, Tabs, message, Empty, Modal, Select, Spin, Popconfirm, Tooltip } from "antd";
import EvlQuestionForm from "./EvlAddQuestion";
import "@/app/global.css";
import { debounce } from "lodash";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
export type ScaleItem = {
  value: number;
  label: string;
};
export type StoredQuestion = {
  id: number;
  section: string;
  question: string;
  scaleMin: number;
  scaleMax: number;
  selected: string;
  scale: ScaleItem[];
};
type psychometricQuestion = {
  ID: number;
  SECTION: string;
  QUESTION: string;
  SCALE_MIN: number;
  SCALE_MAX: number;
  SELECTED: string | null;
  SCALE: string;
};

export default function EvlEpiQuestions({
  isEpiQuestionModalVisible,
  handleEpiQuestionSave,
  setIsEpiQuestionModalVisible,
  epi_question,
}: {
  isEpiQuestionModalVisible: boolean;
  handleEpiQuestionSave: (value: any) => void;
  setIsEpiQuestionModalVisible: (value: boolean) => void;
  epi_question: any;
}) {
  const [questions, setQuestions] = useState<StoredQuestion[]>(epi_question);

  const [nextId, setNextId] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<StoredQuestion | null>(null);
const [psychometricQuestions, setPsychometricQuestions] = useState<psychometricQuestion[]>([]);  
const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setQuestions(epi_question || []);
  }, [epi_question]);
  const openAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setFormOpen(true);
  };
  console.log(questions, "questions...", epi_question, "epi_question");
  const openEdit = (record: StoredQuestion) => {
    setFormMode("edit");
    setEditTarget(record);
    setFormOpen(true);
  };

  // const handleFormSubmit = (question: StoredQuestion) => {
  //   if (formMode === "add") {
  //     setQuestions((prev) => [...prev, question]);
  //     setNextId((prev) => prev + 1);
  //   } else {
  //     setQuestions((prev) =>
  //       prev.map((q) => (q.id === question.id ? question : q))
  //     );
  //   }
  // };
  const getNextAvailableId = (questions: StoredQuestion[]): number => {
  return questions.length === 0 ? 1 : Math.max(...questions.map(q => q.id)) + 1;
};

  const handleFormSubmit = (question: StoredQuestion) => {
  setQuestions((prev) => {
    if (formMode === "add") {
      const newId = getNextAvailableId(prev);
      const newQuestion = { ...question, id: newId };
      return [...prev, newQuestion];
    } else {
      return prev.map((q) => (q.id === question.id ? question : q));
    }
  });

  if (formMode === "add") {
    setNextId((prev) => prev + 1); 
  }
};

  const sections = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return Array.from(new Set(questions.map((q) => q.section)));
  }, [questions]);
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate/Admin/psychometric-que-dropdowns");
      const data = await res.json();
      setPsychometricQuestions(data.questions || []);
    } catch (error) {
      console.error("Failed to fetch psychometric questions:", error);
    } finally {
      setLoading(false);
    }
  };

 
  const fetchQuestionsDebounced = debounce(fetchQuestions, 300);

  useEffect(() => {
    fetchQuestions(); 
  }, []);
  function parseScaleJson(scaleString: string): ScaleItem[] {
  try {
    const parsed = JSON.parse(scaleString);
    if (Array.isArray(parsed)) {
      return parsed.map((s: any) => ({
        value: s.value,
        label: s.label,
      }));
    }
  } catch (e) {
    console.warn("Failed to parse SCALE JSON:", e);
  }
  return [];
}

//   const handleSubmitSelectedQuestions = () => {
//   const selectedQuestions = psychometricQuestions
//     .filter(q => selectedQuestionIds.includes(q.ID))
//     .map<StoredQuestion>((q) => ({
//       id: q.ID,
//       section: q.SECTION,
//       question: q.QUESTION,
//       scaleMin: q.SCALE_MIN,
//       scaleMax: q.SCALE_MAX,
//       selected: q.SELECTED || "", 
//       scale: parseScaleJson(q.SCALE),
//     }));

//   // Merge with current form-added questions
//   setQuestions((prevQuestions) => {
//     const existingIds = new Set(prevQuestions.map(q => q.id));
//     const newQuestions = selectedQuestions.filter(q => !existingIds.has(q.id));
//     return [...prevQuestions, ...newQuestions];
//   });

//   message.success("Selected questions added!");
// };

const handleSubmitSelectedQuestions = () => {
  setQuestions((prev) => {
    let nextId = getNextAvailableId(prev);

    const selectedQuestions: StoredQuestion[] = psychometricQuestions
      .filter(q => selectedQuestionIds.includes(q.ID))
      .map((q) => {
        const converted: StoredQuestion = {
          id: nextId++,
          section: q.SECTION,
          question: q.QUESTION,
          scaleMin: q.SCALE_MIN,
          scaleMax: q.SCALE_MAX,
          selected: q.SELECTED || "",
          scale: parseScaleJson(q.SCALE),
        };
        return converted;
      });

    return [...prev, ...selectedQuestions];
  });

  message.success("Selected questions added!");
  setSelectedQuestionIds([]);
};

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Question", dataIndex: "question" },
    { title: "Scale Max", dataIndex: "scaleMax" },
    {
      title: "Scale Labels",
      render: (_: any, r: StoredQuestion) =>
        r.scale.map((s) => `${s.value}: ${s.label}`).join(", "),
    },
    {
  title: "Action",
  render: (_: any, r: StoredQuestion) => (
    <>
      <Tooltip title="Edit">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openEdit(r)}
        />
      </Tooltip>
      <Popconfirm
        title="Are you sure you want to delete this question?"
        onConfirm={() => handleDeleteQuestion(r.id)}
        okText="Yes"
        cancelText="No"
      >
        <Tooltip title="Delete">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
          />
        </Tooltip>
      </Popconfirm>
    </>
  )
}

  ];
const handleDeleteQuestion = (id: number) => {
  setQuestions((prev) => prev.filter((q) => q.id !== id));
  message.success("Question deleted!");
};

  return (
    <Modal
      open={isEpiQuestionModalVisible}
      onCancel={() => setIsEpiQuestionModalVisible(false)}
      onOk={() => {
        handleEpiQuestionSave(questions);
      }}
      okButtonProps={{
        className: "contentaddbutton1", 
      }}
      width={"95vw"}
    >
      <div style={{ paddingTop: 24, paddingLeft: 24, paddingBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="MainTitle"> Add EPI Question</div>
          <Button
            type="primary"
            className="contentaddbutton1"
            onClick={openAdd}
          >
            Add Question
          </Button>
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Select Questions: </label>
          <Select
            mode="multiple"
            labelInValue
            value={selectedQuestionIds.map((id) => {
              const question = psychometricQuestions.find((q) => q.ID === id);
              return { key: String(id), label: question?.QUESTION || String(id) };
            })}
            placeholder="Search and select questions"
            notFoundContent={loading ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={fetchQuestionsDebounced}
            onChange={(values) => {
              const ids = values.map((v) => Number(v.key));
              setSelectedQuestionIds(ids);
            }}
            style={{ width: "50%" }}
          >
            {psychometricQuestions.map((question) => (
              <Select.Option key={question.ID} value={String(question.ID)}>
                {question.QUESTION}
              </Select.Option>
            ))}
          </Select>

          <button
            onClick={handleSubmitSelectedQuestions}
            style={{ padding: "6px 15px", borderRadius: '6px', marginLeft: '10px' }}
            className="contentaddbutton1"
          >
            OK
          </button>
        </div>

        {sections.length === 0 ? (
          <Empty style={{ marginTop: 40 }} description="No questions yet" />
        ) : (
          <Tabs style={{ marginTop: 32 }} type="line">
            {sections.map((section) => (
              <Tabs.TabPane tab={section} key={section}>
                <Table
                  className="CC_Table"
                  dataSource={questions.filter((q) => q.section === section)}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  bordered
                />
              </Tabs.TabPane>
            ))}
          </Tabs>
        )}

        <EvlQuestionForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          mode={formMode}
          nextId={nextId}
          initialData={editTarget ?? undefined}
        />
      </div>
    </Modal>
  );
}
