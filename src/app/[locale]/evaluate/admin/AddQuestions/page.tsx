"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Upload,
  Button,
  message,
  Table,
  Select,
  Tooltip,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import { useSession } from "next-auth/react";
import { FaPlusCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { RcFile } from "antd/es/upload";
import { useRouter } from "next/navigation";
import TextArea from "antd/es/input/TextArea";
import { ColumnType } from "antd/es/table";
import "@/app/global.css";


interface Subject {
  subject_id: number;
  subject_description: string;
  subject_code?: string;
}

interface Topic {
  topic_id: number;
  topic_description: string;
  topic_code?: string;
}

const Home = () => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [testData, setTestData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { data: session } = useSession();
  const userId = session?.user?.id as number | undefined;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResourceCode, setSelectedResourceCode] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [uploadingQuestion, setUploadingQuestion] = useState<{ QUESTION_ID: number } | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const router = useRouter();

  // -------------------------
  // Helper: normalize answer
  // - Accepts input like "a , c", "A|C", "A; C", ["A","C"] (if JSON)
  // - Returns uppercase comma separated string: "A,C"
  // -------------------------
  const normalizeAnswerForSave = (raw: any): string | null => {
    if (raw === null || raw === undefined) return null;
    // if incoming is an array, join after trimming/uppercasing
    if (Array.isArray(raw)) {
      const arr = raw.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
      return arr.length ? Array.from(new Set(arr)).join(",") : null;
    }
    // string path: split on comma / pipe / semicolon / whitespace and join with comma
    const s = String(raw).trim();
    if (s === "") return null;
    const parts = s.split(/[\s,;|]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
    if (!parts.length) return null;
    // deduplicate preserving order
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const p of parts) {
      if (!seen.has(p)) {
        seen.add(p);
        deduped.push(p);
      }
    }
    return deduped.join(",");
  };

  const handleUploadHelp = (record: any) => {
    setUploadingQuestion(record);
    setIsHelpModalOpen(true);
  };

  const handleHelpFileUpload = async ({ file }: any) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("QUESTION_ID", uploadingQuestion?.QUESTION_ID?.toString() || "");
    try {
      await axios.post("/api/evaluate/resources", formData);
      messageApi.success("Help file uploaded successfully");
      setIsHelpModalOpen(false);
      setUploadingQuestion(null);
      fetchData();
    } catch {
      messageApi.error("Failed to upload help file");
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please upload a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj);
    setLoading(true);
    try {
      await axios.post(
        "/api/evaluate/Admin/AddQuestions?subfolder=eval_questions&table=eval_questions",
        formData
      );
      message.success("File uploaded successfully!");
      setImported(true);
    } catch {
      message.error("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!selectedSubject || !selectedTopic) return; // guard
    try {
      setLoading(true);
      const response = await axios.get("/api/evaluate/getQuestions", {
        params: { subjectId: selectedSubject, topicId: selectedTopic },
      });
      setTestData(Array.isArray(response.data) ? response.data : []);
    } catch {
      messageApi.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedTopic, messageApi]);

  const handleFetchClick = () => {
    if (!selectedSubject || !selectedTopic) {
      messageApi.warning("Please select both Subject and Topic.");
      return;
    }
    fetchData();
  };

  // Load subjects/topics on mount
  useEffect(() => {
    const fetchSubTopicData = async () => {
      try {
        const resSubjects = await fetch("/api/evaluate/subjects-mapping");
        const resTopics = await fetch("/api/evaluate/topics-mapping");
        const subjectsData = await resSubjects.json();
        const topicsData = await resTopics.json();
        if (Array.isArray(subjectsData)) setSubjects(subjectsData);
        if (Array.isArray(topicsData)) setTopics(topicsData);
      } catch {
        messageApi.error("Failed to load subjects/topics");
      }
    };
    fetchSubTopicData();
  }, [messageApi]);

  // Auto-refetch when Subject/Topic change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (questionId: number) => {
    try {
      await axios.delete("/api/evaluate/getQuestions", { params: { id: questionId } });
      messageApi.success("Question deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      messageApi.error("Failed to delete question");
    }
  };

  const handleAddResource = async (question: any) => {
    setSelectedQuestion(question);
    if (!question.SUBJECT_ID || !question.TOPIC_ID) {
      messageApi.error("Invalid question data. SUBJECT_ID or TOPIC_ID is missing.");
      return;
    }
    try {
      const res = await axios.get("/api/evaluate/resources", {
        params: { subjectId: question.SUBJECT_ID, topicId: question.TOPIC_ID },
      });
      if (Array.isArray(res.data) && res.data.length === 0) {
        messageApi.info("No resources found for this topic.");
      } else {
        setResources(res.data);
        setIsResourceModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load resources:", err);
      messageApi.error("Failed to load resources.");
    }
  };

  const handleUpdate = async () => {
    try {
      // Normalize answer before sending update
      const normalizedAnswer = normalizeAnswerForSave(editingRecord?.ANSWER);
      const payload = { ...editingRecord, MODIFIED_BY: userId, ANSWER: normalizedAnswer };
      await axios.put("/api/evaluate/getQuestions", payload);
      messageApi.success("Question updated successfully");
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 409) {
        messageApi.warning("Duplicate question number for the selected subject and topic.");
      } else {
        messageApi.error("Failed to update question");
      }
    }
  };

  const getColumnSearchProps = (
    dataIndex: string,
    placeholder?: string
  ): ColumnType<any> => ({
    sorter: (a, b) => {
      const valA = a[dataIndex] ?? "";
      const valB = b[dataIndex] ?? "";
      return String(valA).localeCompare(String(valB));
    },
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${placeholder || dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button onClick={() => clearFilters?.()} type="link">Reset</Button>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value: string | number | boolean | bigint, record: any) =>
      String(record[dataIndex] ?? "").toLowerCase().includes(String(value).toLowerCase()),
  });

  const columns: ColumnType<any>[] = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Edit Question">
            <Button
              icon={<EditOutlined />}
              type="link"
              onClick={async () => {
                setEditingRecord(record);
                setIsEditModalOpen(true);
                if (record?.SUBJECT_ID && record?.TOPIC_ID) {
                  const res = await axios.get("/api/evaluate/resources", {
                    params: { subjectId: record.SUBJECT_ID, topicId: record.TOPIC_ID },
                  });
                  setResources(res.data);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Question">
            <Button
              icon={<DeleteOutlined />}
              type="link"
              danger
              onClick={() => handleDelete(record.QUESTION_ID)}
            />
          </Tooltip>
          <Tooltip title="Add Resource">
            <Button icon={<PlusOutlined />} type="link" onClick={() => handleAddResource(record)} />
          </Tooltip>
          <Tooltip title="Upload Help Files">
            <Button icon={<UploadOutlined />} type="link" onClick={() => handleUploadHelp(record)} />
          </Tooltip>
        </Space>
      ),
    },

    // Descriptive columns from API joins
    { title: "Subject", dataIndex: "subject_description", key: "subject_description", render: t => t ?? "NULL", ...getColumnSearchProps("subject_description") },
    { title: "Topic", dataIndex: "topic_description", key: "topic_description", render: t => t ?? "NULL", ...getColumnSearchProps("topic_description") },

    { title: "Question Number", dataIndex: "QUESTION_NUMBER", key: "QUESTION_NUMBER", render: t => t ?? "NULL", ...getColumnSearchProps("QUESTION_NUMBER") },
    { title: "Question", dataIndex: "QUESTION", key: "QUESTION", render: t => t ?? "NULL", ...getColumnSearchProps("QUESTION") },

    { title: "Choice 1", dataIndex: "CHOICE1", key: "CHOICE1", render: t => t ?? "NULL", ...getColumnSearchProps("CHOICE1") },
    { title: "Choice 2", dataIndex: "CHOICE2", key: "CHOICE2", render: t => t ?? "NULL", ...getColumnSearchProps("CHOICE2") },
    { title: "Choice 3", dataIndex: "CHOICE3", key: "CHOICE3", render: t => t ?? "NULL", ...getColumnSearchProps("CHOICE3") },
    { title: "Choice 4", dataIndex: "CHOICE4", key: "CHOICE4", render: t => t ?? "NULL", ...getColumnSearchProps("CHOICE4") },

    { title: "Answer", dataIndex: "ANSWER", key: "ANSWER", render: t => t ?? "NULL", ...getColumnSearchProps("ANSWER") },
    { title: "Complexity", dataIndex: "COMPLEXITY", key: "COMPLEXITY", render: t => t ?? "NULL", ...getColumnSearchProps("COMPLEXITY") },
    { title: "Question Source", dataIndex: "QUESTION_SOURCE", key: "QUESTION_SOURCE", render: t => t ?? "NULL", ...getColumnSearchProps("QUESTION_SOURCE") },
    { title: "Link", dataIndex: "LINK", key: "LINK", render: t => t ?? "NULL", ...getColumnSearchProps("LINK") },

    { title: "Created By", dataIndex: "CREATED_BY_NAME", key: "CREATED_BY_NAME", render: t => t ?? "NULL", ...getColumnSearchProps("CREATED_BY_NAME") },
    { title: "Created Date", dataIndex: "CREATED_DATE", key: "CREATED_DATE", render: t => (t ? String(t).slice(0, 10) : "NULL"), ...getColumnSearchProps("CREATED_DATE") },
    { title: "Modified By", dataIndex: "MODIFIED_BY_NAME", key: "MODIFIED_BY_NAME", render: t => t ?? "NULL", ...getColumnSearchProps("MODIFIED_BY_NAME") },
    { title: "Modified Date", dataIndex: "MODIFIED_DATE", key: "MODIFIED_DATE", render: t => (t ? String(t).slice(0, 10) : "NULL"), ...getColumnSearchProps("MODIFIED_DATE") },

    { title: "Question Type", dataIndex: "QUESTION_TYPE", key: "QUESTION_TYPE", render: t => t ?? "NULL", ...getColumnSearchProps("QUESTION_TYPE") },
    { title: "Parent Question Number", dataIndex: "PARENT_QUESTION_NUMBER", key: "PARENT_QUESTION_NUMBER", render: t => t ?? "NULL", ...getColumnSearchProps("PARENT_QUESTION_NUMBER") },

    { title: "Help Text", dataIndex: "Help_text", key: "Help_text", render: t => t ?? "NULL", ...getColumnSearchProps("Help_text") },

    {
      title: "Help Files",
      dataIndex: "HELP_FILES",
      key: "HELP_FILES",
      render: (text: string) => {
        if (!text) return "NULL";
        const imageUrl = text.startsWith("/static/files/") ? text : `/static/files/${text}`;
        const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(imageUrl);
        const url = imageUrl.replace(/^\/?static\/files\//, "");
        return isImage ? (
          <img
            src={`/static/files/${url}`}
            alt="Help File"
            style={{ width: "100px", height: "auto", objectFit: "cover" }}
          />
        ) : (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">View File</a>
        );
      },
      ...getColumnSearchProps("HELP_FILES"),
    },

    {
      title: "Options",
      dataIndex: "OPTIONS",
      key: "OPTIONS",
      render: t => t ?? "NULL",
      ...getColumnSearchProps("OPTIONS"),
    },
    {
      title: "Negative Marks",
      dataIndex: "negative_marks",
      key: "negative_marks",
      render: t => t ?? "NULL",
      sorter: (a, b) => Number(a.negative_marks ?? 0) - Number(b.negative_marks ?? 0),
      ...getColumnSearchProps("negative_marks"),
    },
  ];

  const handleAssignResource = async () => {
    if (!selectedQuestion || !selectedResourceCode) {
      messageApi.warning("Please select a resource.");
      return;
    }
    try {
      await axios.put("/api/evaluate/resources", {
        QUESTION_ID: selectedQuestion.QUESTION_ID,
        PARENT_QUESTION_NUMBER: selectedResourceCode,
      });
      messageApi.success("Resource assigned successfully");
      setIsResourceModalOpen(false);
      setSelectedResourceCode(null);
      fetchData();
    } catch {
      messageApi.error("Failed to assign resource.");
    }
  };

  // -------------------------
  // Add new question: normalize ANSWER before sending
  // -------------------------
  const handleAddQuestion = async (values: any) => {
    try {
      const normalizedAnswer = normalizeAnswerForSave(values?.ANSWER);
      const enriched = { ...values, CREATED_BY: userId, ANSWER: normalizedAnswer };
      const res = await fetch("/api/evaluate/getQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enriched),
      });
      const data = await res.json();
      if (res.ok) {
        messageApi.success("Question added successfully");
        setIsModalVisible(false);
        form.resetFields();
        fetchData();
      } else if (res.status === 409) {
        messageApi.warning(data.message);
      } else {
        messageApi.error(`Failed: ${data.message}`);
      }
    } catch (err) {
      console.error("Add question error:", err);
      messageApi.error("Something went wrong");
    }
  };

  const handleHelpAddFileUpload = async (options: UploadRequestOption<any>) => {
    const { file } = options;
    const formData = new FormData();
    formData.append("file", file as any);
    try {
      const response = await fetch("/api/evaluate/helpfilesupload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.filename) {
        messageApi.success("Help file uploaded");
        if (isModalVisible) {
          form.setFieldValue("HELP_FILES", result.filename);
        } else if (isEditModalOpen && editingRecord) {
          setEditingRecord((prev: any) => ({ ...prev, HELP_FILES: result.filename }));
        }
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Help File Upload Error:", error);
      messageApi.error("Help file upload failed");
    }
  };

  const handleFileUpload = async (file: RcFile) => {
    try {
      if (!selectedSubject || !selectedTopic) {
        messageApi.warning("Please select both Subject and Topic before uploading.");
        return false;
      }
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet).map((row) =>
        Object.fromEntries(
          Object.entries(row as Record<string, any>).map(([key, value]) => [
            key,
            value === "NULL" ? null : value,
          ])
        )
      );

      // IMPORTANT:
      // We normalize ANSWER here as well before sending the bulk upload.
      const enrichedData = jsonData.map((row) => ({
        ...row,
        SUBJECT_ID: selectedSubject,
        TOPIC_ID: selectedTopic,
        CREATED_BY: userId,
        ANSWER: normalizeAnswerForSave(row.ANSWER),
      }));

      const response = await fetch("/api/evaluate/upload-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedData),
      });

      if (response.ok) {
        const result = await response.json();
        const skipped = result.skippedQuestions?.join(", ") || "";
        messageApi.success(`Uploaded successfully. Skipped ${result.skippedCount} duplicate(s).`);
        if (skipped) messageApi.info(`Duplicates: ${skipped}`);
        setLoading(true);
        await fetchData();
        setLoading(false);
      } else if (response.status === 409) {
        const result = await response.json();
        messageApi.warning(result.message);
        if (result.skippedQuestions?.length) {
          messageApi.info(`Duplicates: ${result.skippedQuestions.join(", ")}`);
        }
      } else {
        const errorRes = await response.json();
        messageApi.error(`Upload failed: ${errorRes.message}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      messageApi.error("Something went wrong during upload.");
    }
    return false;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/templates/question_template.xlsx";
    link.download = "question_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div>
        <div className="MainTitle">QUESTIONS</div>
      </div>

      <div style={{ flexDirection: "column" }}>
        {contextHolder}
        <div className="Table-One-Div-Appli">
          <div
            style={{
              display: "flex",
              gap: "11px",
              alignItems: "flex-start",
              flexWrap: "nowrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ marginBottom: "4px" }}>Select Subject</label>
              <Select
                placeholder="Select Subject"
                onChange={(value) => setSelectedSubject(value)}
                value={selectedSubject ?? undefined}
                style={{ width: 200 }}
                showSearch
                optionFilterProp="children"
              >
                {subjects.map((subject) => (
                  <Select.Option
                    key={subject.subject_id}
                    value={subject.subject_id}
                  >
                    {`${subject.subject_description}${subject.subject_code ? ` - ${subject.subject_code}` : ""
                      }`}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ marginBottom: "4px" }}>Select Topic</label>
              <Select
                placeholder="Select Topic"
                onChange={(value) => setSelectedTopic(value)}
                value={selectedTopic ?? undefined}
                style={{ width: 200 }}
                showSearch
                optionFilterProp="children"
              >
                {topics.map((topic) => (
                  <Select.Option key={topic.topic_id} value={topic.topic_id}>
                    {`${topic.topic_description}${topic.topic_code ? ` - ${topic.topic_code}` : ""
                      }`}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {selectedSubject && selectedTopic && (
              <div style={{ marginTop: "22px" }}>
                <Button
                  type="primary"
                  className="primary-btn"
                  onClick={handleFetchClick}
                >
                  Get Questions
                </Button>
              </div>
            )}

            <div style={{ marginTop: "22px" }}>
              <Button
                icon={<DownloadOutlined />}
                className="primary-btn"
                type="primary"
                onClick={handleDownload}
              >
                <span style={{ marginLeft: "8px" }}> Download Template </span>
              </Button>
            </div>

            {selectedSubject && selectedTopic && (
              <div style={{ marginTop: "22px" }}>
                <Upload
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  accept=".xlsx,.xls"
                >
                  <Button icon={<UploadOutlined />} className="primary-btn" type="primary">
                    <span style={{ marginLeft: "8px" }}> Upload Questions </span>
                  </Button>
                </Upload>
              </div>
            )}

            <div style={{ marginTop: "22px" }}>
              <Button
                className="primary-btn"
                type="primary"
                icon={<FaPlusCircle />}
                onClick={() => setIsModalVisible(true)}
              >
                <span style={{ marginLeft: "8px" }}> Add Question </span>
              </Button>
            </div>
          </div>
        </div>

        <Row>
          <div style={{ marginTop: "15px", overflow: "auto" }}>
            <Table
              columns={columns}
              dataSource={testData}
              // ✅ FIX: the unique key actually present on each record
              rowKey="QUESTION_ID"
              className="CC_Table"
              loading={loading}
              scroll={{ x: 3700 }}
            />
          </div>
        </Row>

        {/* Edit Modal */}
        <Modal
          title="Edit Question"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          onOk={handleUpdate}
          okText="Update"
          width={700}
          maskClosable={false}
        >
          <Form layout="vertical">
            <Form.Item label="Subject" rules={[{ required: true }]}>
              <Select
                placeholder="Select Subject"
                value={editingRecord?.SUBJECT_ID}
                onChange={(value) =>
                  setEditingRecord({ ...editingRecord, SUBJECT_ID: value })
                }
              >
                {subjects.map((subject) => (
                  <Select.Option
                    key={subject.subject_id}
                    value={subject.subject_id}
                  >
                    {subject.subject_description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Topic" rules={[{ required: true }]}>
              <Select
                placeholder="Select Topic"
                value={editingRecord?.TOPIC_ID}
                onChange={(value) =>
                  setEditingRecord({ ...editingRecord, TOPIC_ID: value })
                }
              >
                {topics.map((topic) => (
                  <Select.Option key={topic.topic_id} value={topic.topic_id}>
                    {topic.topic_description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Question Number" rules={[{ required: true }]}>
              <Input
                value={editingRecord?.QUESTION_NUMBER}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    QUESTION_NUMBER: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Question" rules={[{ required: true }]}>
              <Input.TextArea
                value={editingRecord?.QUESTION}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    QUESTION: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Choice A" rules={[{ required: true }]}>
              <Input
                value={editingRecord?.CHOICE1}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    CHOICE1: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Choice B" rules={[{ required: true }]}>
              <Input
                value={editingRecord?.CHOICE2}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    CHOICE2: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Choice C" rules={[{ required: true }]}>
              <Input
                value={editingRecord?.CHOICE3}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    CHOICE3: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Choice D" rules={[{ required: true }]}>
              <Input
                value={editingRecord?.CHOICE4}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    CHOICE4: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Answer" rules={[{ required: true }]}>
              {/* Inform admins that multiple answers should be entered as comma-separated values */}
              <Input
                value={editingRecord?.ANSWER}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, ANSWER: e.target.value })
                }
                placeholder="e.g. A  or  A,C  or  A|C"
              />
            </Form.Item>

            <Form.Item label="Complexity">
              <Input
                value={editingRecord?.COMPLEXITY}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    COMPLEXITY: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Question Source">
              <Input
                value={editingRecord?.QUESTION_SOURCE}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    QUESTION_SOURCE: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Link">
              <Input
                value={editingRecord?.LINK}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, LINK: e.target.value })
                }
              />
            </Form.Item>

            {/* Replace existing "Question Type" Form.Item (which currently uses <Input />) with this Select */}
            <Form.Item label="Question Type" rules={[{ required: true }]}>
              <Select
                placeholder="Select Type"
                value={editingRecord?.QUESTION_TYPE ?? undefined}
                onChange={(value) =>
                  setEditingRecord({
                    ...editingRecord,
                    QUESTION_TYPE: value,
                  })
                }
                allowClear
              >
                <Select.Option value="MC">Multiple Choice</Select.Option>
                <Select.Option value="MULTICHOICE">Multi Choice</Select.Option>
                <Select.Option value="ARRANGE">Arrange</Select.Option>
                <Select.Option value="TEXT">Text</Select.Option>
                <Select.Option value="TEXTAREA">Text Area</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Parent Question Number">
              <Select
                placeholder="Select Resource"
                value={editingRecord?.PARENT_QUESTION_NUMBER}
                onChange={(value) =>
                  setEditingRecord({
                    ...editingRecord,
                    PARENT_QUESTION_NUMBER: value,
                  })
                }
                allowClear
                showSearch
              >
                {resources.map((res) => (
                  <Select.Option
                    key={res.resource_code}
                    value={res.resource_code}
                  >
                    {res.RESOURCE ?? res.resource_code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Help Text">
              <Input.TextArea
                value={editingRecord?.Help_text}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    Help_text: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Help File">
              <Upload
                customRequest={handleHelpAddFileUpload}
                showUploadList={false}
                accept=".pdf,.docx,.txt,.png,.jpg,.mp3,.wav,.ogg,.m4a"
              >
                <Button icon={<UploadOutlined />} type="primary">
                  <span style={{ marginLeft: "8px" }}>Upload Help File</span>
                </Button>
              </Upload>

              {editingRecord?.HELP_FILES && (
                <div style={{ marginTop: "8px", color: "#555" }}>
                  {editingRecord.HELP_FILES}
                </div>
              )}
            </Form.Item>

            <Form.Item label="Options">
              <Input
                value={editingRecord?.OPTIONS}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    OPTIONS: e.target.value,
                  })
                }
              />
            </Form.Item>

            <Form.Item label="Negative Marks">
              <Input
                value={editingRecord?.negative_marks}
                onChange={(e) =>
                  setEditingRecord({
                    ...editingRecord,
                    negative_marks: e.target.value,
                  })
                }
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Assign Resource */}
        <Modal
          title="Assign Resource"
          open={isResourceModalOpen}
          onCancel={() => {
            setIsResourceModalOpen(false);
            setSelectedResourceCode(null);
          }}
          onOk={handleAssignResource}
          okText="Assign"
          maskClosable={false}
        >
          <Form layout="vertical">
            <Form.Item label="Select Resource">
              <Select
                placeholder="Select Resource"
                onChange={(value) => setSelectedResourceCode(value)}
                value={selectedResourceCode ?? undefined}
              >
                {resources.map((res) => (
                  <Select.Option
                    key={res.resource_code}
                    value={res.resource_code}
                  >
                    {res.resource_code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Add New Question */}
        <Modal
          title="Add New Question"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
          width={700}
          maskClosable={false}
        >
          <Form layout="vertical" form={form} onFinish={handleAddQuestion}>
            <Form.Item name="SUBJECT_ID" label="Subject" rules={[{ required: true }]}>
              <Select placeholder="Select Subject" showSearch optionFilterProp="children">
                {subjects.map((subject: any) => (
                  <Select.Option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="TOPIC_ID" label="Topic" rules={[{ required: true }]}>
              <Select placeholder="Select Topic" showSearch optionFilterProp="children">
                {topics.map((topic: any) => (
                  <Select.Option key={topic.topic_id} value={topic.topic_id}>
                    {topic.topic_description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="QUESTION_NUMBER" label="Question Number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="QUESTION" label="Question" rules={[{ required: true }]}>
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="CHOICE1" label="Choice A" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="CHOICE2" label="Choice B" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="CHOICE3" label="Choice C" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="CHOICE4" label="Choice D" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="ANSWER" label="Answer" rules={[{ required: true }]}>
              {/* Hint to help admin: multiple answers should be comma-separated */}
              <Input placeholder="e.g. A  or  A,C  or  A|C" />
            </Form.Item>

            <Form.Item name="COMPLEXITY" label="Complexity">
              <InputNumber min={1} max={5} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="QUESTION_SOURCE" label="Question Source">
              <Input />
            </Form.Item>

            <Form.Item name="LINK" label="Link">
              <Input />
            </Form.Item>

            <Form.Item name="QUESTION_TYPE" label="Question Type" rules={[{ required: true }]}>
              <Select placeholder="Select Type">
                <Select.Option value="MC">Multiple Choice</Select.Option>
                <Select.Option value="MULTICHOICE">Multi Choice</Select.Option>
                <Select.Option value="ARRANGE">Arrange</Select.Option>
                <Select.Option value="TEXT">Text</Select.Option>
                <Select.Option value="TEXTAREA">Text Area</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="Help_text" label="Help Text">
              <TextArea />
            </Form.Item>

            <Form.Item name="HELP_FILES" label="Help File">
              <Upload
                customRequest={handleHelpAddFileUpload}
                showUploadList={false}
                accept=".pdf,.docx,.txt,.png,.jpg,.mp3,.wav,.ogg,.m4a"
              >
                <Button icon={<UploadOutlined />} type="primary">
                  <span style={{ marginLeft: "8px" }}>Upload Help File</span>
                </Button>
              </Upload>
              {form.getFieldValue("HELP_FILES") && (
                <div style={{ marginTop: "8px", color: "#555" }}>
                  {form.getFieldValue("HELP_FILES")}
                </div>
              )}
            </Form.Item>

            <Form.Item name="OPTIONS" label="Options">
              <TextArea />
            </Form.Item>

            <Form.Item name="negative_marks" label="Negative Marks">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Upload Help File for an existing question */}
        <Modal
          title="Upload Help File"
          open={isHelpModalOpen}
          onCancel={() => setIsHelpModalOpen(false)}
          footer={null}
        >
          <div style={{ marginTop: "20px" }}>
            <Upload
              customRequest={handleHelpFileUpload}
              showUploadList={false}
              accept=".pdf,.docx,.txt,.png,.jpg,.mp3,.wav,.ogg,.m4a"
            >
              <Button icon={<UploadOutlined />} className="primary-btn" type="primary">
                <span style={{ marginLeft: "8px" }}>Upload Help File</span>
              </Button>
            </Upload>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Home;
