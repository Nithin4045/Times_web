"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Form,
  Space,
  message,
  Table,
  Select,
  Upload,
  Popover,
} from "antd";
import { EditOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";

import styles from "@/app/[locale]/evaluate/admin/addresources/addresources.module.css";
import "@/app/global.css";
import CRichTextEditor from "@/components/codecompiler/CRichTextEditor";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

interface Test {
  RESOURCE_ID: number;
  SUBJECT_ID?: number;
  TOPIC_ID?: number | string;
  RESOURCE_TYPE?: string;
  COMPLEXITY?: string | number | null;
  RESOURCE?: string | null;
  resource_code?: string | null;
  RESOURCE_FILES?: string | null;
  TOPIC_NAME?: string | null;
  SUBJECT_NAME?: string | null;
}

type ResourceType = "image" | "audio" | "Para";

const AddResource = () => {
  const [data, setData] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [subjectdata, setsubjectsData] = useState<any[]>([]);
  const [Topicdata, setTopicData] = useState<any[]>([]);
  const [selectedtopic, setselectedtopic] = useState<any>();
  const [resourceType, setResourceType] = useState<ResourceType>("image");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textmodal, setText] = useState<string>("");
  const [questionDescription, setQuestionDescription] = useState("");

  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchDataSubjects();
    fetchDataTopic();
  }, []);

  // ---- FETCH & NORMALIZE ----
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluate/Admin/addresources");
      const result = await response.json();
      const raw: any[] = result.tests || [];

      // Normalize each record so front-end fields match MSSQL shape (uppercase keys)
      const normalized: Test[] = raw.map((r) => ({
        RESOURCE_ID: r.RESOURCE_ID ?? r.resource_id,
        COMPLEXITY: r.COMPLEXITY ?? r.complexity ?? null,
        RESOURCE_TYPE: r.RESOURCE_TYPE ?? r.resource_type ?? null,
        RESOURCE_FILES: r.RESOURCE_FILES ?? r.resource_files ?? null,
        resource_code: r.resource_code ?? r.resource_code ?? null,
        RESOURCE: r.RESOURCE ?? r.resource ?? null,
        SUBJECT_ID:
          r.SUBJECT_ID ??
          r.subject_id ??
          (typeof r.subject_id === "string" ? Number(r.subject_id) : undefined),
        SUBJECT_NAME: r.SUBJECT_NAME ?? r.subject_name ?? null,
        TOPIC_ID: r.TOPIC_ID ?? r.topic_id ?? null,
        TOPIC_NAME: r.TOPIC_NAME ?? r.topic_name ?? null,
      }));

      setData(normalized);
      console.log("Fetched and shaped resources:", normalized);
    } catch (error) {
      console.error("fetchData error:", error);
      message.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSubjects = async () => {
    try {
      const response = await fetch("/api/evaluate/Admin/addsection");
      const result = await response.json();
      const subs = result.tests || [];
      setsubjectsData(subs);
      console.log("Fetched subjects:", subs);
    } catch (error) {
      console.error("fetchDataSubjects error:", error);
      message.error("Failed to load subjects");
    }
  };

  const fetchDataTopic = async () => {
    try {
      const response = await fetch("/api/evaluate/Admin/addtopic");
      const result = await response.json();
      setTopicData(result.tests || []);
    } catch (error) {
      console.error("fetchDataTopic error:", error);
      message.error("Failed to load topics");
    }
  };

  // ---- FORM SUBMIT ----
  const handleAddOrEditTest = async (values: any) => {
    try {
      const formData = new FormData();
      // keep uppercase keys to match server if it expects them
      formData.append("RESOURCE_TYPE", values.RESOURCE_TYPE);
      formData.append("RESOURCE", questionDescription);
      formData.append("SUBJECT_ID", values.SUBJECT_ID);
      formData.append("resource_code", values.resource_code);
      formData.append("TOPIC_ID", values.TOPIC_ID);
      formData.append("COMPLEXITY", values.COMPLEXITY);

      if (values.RESOURCE_FILES && values.RESOURCE_FILES[0]) {
        const origin = values.RESOURCE_FILES[0].originFileObj;
        if (origin) formData.append("RESOURCE_FILES", origin);
      } else if (editingTest?.RESOURCE_FILES) {
        // Send existing filename so backend preserves it (optional; backend may already handle)
        formData.append("existing_file_name", editingTest.RESOURCE_FILES);
      }

      const url = editingTest
        ? `/api/evaluate/Admin/addresources/${editingTest.RESOURCE_ID}`
        : "/api/evaluate/Admin/addresources";
      const method = editingTest ? "PUT" : "POST";

      const response = await fetch(url, { method, body: formData });
      const responseData = await response.json();
      console.log("Response from backend:", responseData);

      if (response.ok) {
        message.success(
          editingTest ? "Test updated successfully" : "Test added successfully"
        );
        setIsTestModalOpen(false);
        form.resetFields();
        setQuestionDescription("");
        setEditingTest(null);
        fetchData();
      } else {
        message.error(responseData?.message || "Failed to save test");
      }
    } catch (error) {
      console.error("handleAddOrEditTest error:", error);
      message.error("Something went wrong");
    }
  };

  const handleResourceTypeChange = (value: ResourceType) => {
    setResourceType(value);
    form.setFieldsValue({ RESOURCE_TYPE: value, RESOURCE_FILES: [] });
  };

  // ---- EDIT / VIEW ----
  const handleEdit = (record: Test) => {
    console.log("Editing record:", record);
    setIsViewMode(false);
    setEditingTest(record);
    setIsTestModalOpen(true);
    setQuestionDescription(record.RESOURCE || "");

    const fileList = record.RESOURCE_FILES
      ? [
        {
          uid: "-1",
          name: record.RESOURCE_FILES,
          status: "done",
          url: `/static/files/${record.RESOURCE_FILES}`,
        },
      ]
      : [];

    form.setFieldsValue({
      SUBJECT_ID: record.SUBJECT_ID,
      TOPIC_ID: record.TOPIC_ID,
      RESOURCE_TYPE: record.RESOURCE_TYPE,
      RESOURCE_FILES: fileList,
      resource_code: record.resource_code,
      COMPLEXITY: record.COMPLEXITY,
    });
  };

  const handleView = (record: Test) => {
    console.log("Viewing record:", record);
    setIsViewMode(true);
    setEditingTest(record);
    setIsTestModalOpen(true);

    const fileList = record.RESOURCE_FILES
      ? [
        {
          uid: "-1",
          name: record.RESOURCE_FILES,
          status: "done",
          url: `/static/files/${record.RESOURCE_FILES}`,
        },
      ]
      : [];

    form.setFieldsValue({
      SUBJECT_ID: record.SUBJECT_ID,
      TOPIC_ID: record.TOPIC_ID,
      RESOURCE_TYPE: record.RESOURCE_TYPE,
      RESOURCE_FILES: fileList,
      resource_code: record.resource_code,
      RESOURCE: record.RESOURCE,
      COMPLEXITY: record.COMPLEXITY,
    });
  };

  // ---- SEARCH HELPERS ----
  const getColumnSearchProps = (dataIndex: keyof Test): ColumnType<Test> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) =>
      String((record[dataIndex] ?? "") as any).toLowerCase().includes(String(value).toLowerCase()),
    sorter: (a, b) => String((a[dataIndex] ?? "") as any).localeCompare(String((b[dataIndex] ?? "") as any)),
  });

  // ---- COLUMNS: match MSSQL front-end exactly ----
  const columns: ColumnType<Test>[] = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Test) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
    {
      title: "Topic Name",
      dataIndex: "TOPIC_NAME",
      key: "TOPIC_NAME",
      ...getColumnSearchProps("TOPIC_NAME"),
      render: (text: string | null | undefined) => <span>{text ?? "-"}</span>,
    },
    {
      title: "Subject Name",
      dataIndex: "SUBJECT_NAME",
      key: "SUBJECT_NAME",
      ...getColumnSearchProps("SUBJECT_NAME"),
      render: (text: string | null | undefined) => <span>{text ?? "-"}</span>,
    },
    {
      title: "Resource Type",
      dataIndex: "RESOURCE_TYPE",
      key: "RESOURCE_TYPE",
      ...getColumnSearchProps("RESOURCE_TYPE"),
      render: (text: string | null | undefined) => <span>{text ?? "-"}</span>,
    },
    {
      title: "Resource",
      dataIndex: "RESOURCE",
      key: "RESOURCE",
      sorter: (a, b) => {
        const valA = (a.RESOURCE ?? "").toString().replace(/<[^>]+>/g, "");
        const valB = (b.RESOURCE ?? "").toString().replace(/<[^>]+>/g, "");
        return valA.localeCompare(valB);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Resource"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
              Search
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        ((record.RESOURCE ?? "").toString().replace(/<[^>]+>/g, "") as string)
          .toLowerCase()
          .includes((value as string).toLowerCase()),
      render: (text: string | null | undefined) => {
        const plainText = text ? text.replace(/<[^>]+>/g, "") : "";
        return plainText.length > 20 ? (
          <Popover
            title="Resource Content"
            content={
              <div style={{ maxWidth: 800, wordBreak: "break-word", whiteSpace: "normal" }} dangerouslySetInnerHTML={{ __html: text || "" }} />
            }
          >
            <span style={{ cursor: "pointer" }}>{plainText.substring(0, 20)}...</span>
          </Popover>
        ) : (
          <span>{plainText}</span>
        );
      },
    },
    {
      title: "File",
      dataIndex: "RESOURCE_FILES",
      key: "RESOURCE_FILES",
      ...getColumnSearchProps("RESOURCE_FILES"),
      render: (fileName: string | null | undefined) => {
        if (!fileName) return "Not Available";
        // const publicPath = `/static/files/${fileName}`;
        const apiPath = `/api/evaluate/files/${encodeURIComponent(fileName)}`;
        return (
          // <a href={publicPath} target="_blank" rel="noopener noreferrer">
          //   {fileName}
          // </a>
          <a href={apiPath} target="_blank" rel="noopener noreferrer">
            {fileName}
          </a>
        );
      },
    },
  ];

  const openModal = () => {
    setEditingTest(null);
    setIsViewMode(false);
    form.resetFields();
    setQuestionDescription("");
    setIsTestModalOpen(true);
  };

  const handleCancelModal = () => {
    setQuestionDescription("");
    form.resetFields();
    setEditingTest(null);
    setIsViewMode(false);
    setIsTestModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.ContentCompilerHeader}>
        <div>
          <div className={styles.ScheduleInterviMainTitle}>RESOURCES</div>
        </div>
        <div>
          <Button type="primary" onClick={openModal} className={styles.generatebutton}>Add Resource</Button>
        </div>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        className={styles.tableData}
        rowKey={(record) => record.RESOURCE_ID ?? record.resource_code ?? Math.random().toString()}
      />

      <Modal title="Add Resources" open={isTestModalOpen} onCancel={handleCancelModal}
        footer={
          !isViewMode && [
            <Button key="cancel" onClick={handleCancelModal}>Cancel</Button>,
            <Button key="submit" type="primary" htmlType="submit" onClick={() => form.submit()}>Submit</Button>,
          ]
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrEditTest}>
          {/* Subject Select */}
          <Form.Item name="SUBJECT_ID" label="Subject" rules={[{ required: true, message: "Please enter subject name" }]}>
            <Select value={undefined} onChange={(v) => form.setFieldsValue({ SUBJECT_ID: v })} style={{ width: "100%" }} placeholder="Select Section" disabled={isViewMode}>
              {subjectdata.map((subject: any) => (
                <Option key={subject.subject_id} value={subject.subject_id}>
                  {`${subject.subject_description} - ${subject.subject_code}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Topic Select */}
          <Form.Item name="TOPIC_ID" label="Topic" rules={[{ required: true, message: "Please enter topic code" }]}>
            <Select value={selectedtopic} onChange={(v) => form.setFieldsValue({ TOPIC_ID: v })} style={{ width: "100%" }} placeholder="Select Topic" disabled={isViewMode}>
              {Topicdata.map((topic: any) => (
                <Option key={topic.topic_id} value={topic.topic_id}>
                  {`${topic.topic_description} - ${topic.topic_code}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Resource Type */}
          <Form.Item name="RESOURCE_TYPE" label="Resource Type" rules={[{ required: true, message: "Please select a resource type" }]}>
            <Select placeholder="Select resource type" onChange={handleResourceTypeChange} allowClear disabled={isViewMode}>
              <Option value="Para">Paragraph</Option>
              <Option value="audio">Audio</Option>
              <Option value="image">Image</Option>
            </Select>
          </Form.Item>

          {/* Upload Field */}
          <Form.Item name="RESOURCE_FILES" label="Upload Resource File" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
            <Upload
              accept={resourceType === "image" ? "image/*" : resourceType === "audio" ? "audio/*" : ".pdf,.txt,.doc,.docx"}
              maxCount={1}
              listType="text"
              disabled={isViewMode}
            >
              {!isViewMode && <Button>Click to Upload</Button>}
            </Upload>
          </Form.Item>

          <CRichTextEditor api={"richText"} onChange={() => { }} label={"Resource"} form={form} value={questionDescription} maxLength={10120202020} isRequired={false} setValue={(val: any) => setQuestionDescription(val)} />

          {/* Resource Code */}
          <Form.Item name="resource_code" label="Resource Code" rules={[
            { required: true, message: "Please enter Resource Code" },
            {
              validator: async (_, value) => {
                if (editingTest) return Promise.resolve();
                if (!value) return Promise.resolve();

                const response = await fetch(`/api/evaluate/Admin/addresources?code=${value}`);
                const data = await response.json();

                if (data.exists) return Promise.reject("Resource Code already exists!");
                return Promise.resolve();
              }
            }
          ]}>
            <Input disabled={isViewMode || editingTest !== null} />
          </Form.Item>

          {/* Complexity */}
          <Form.Item name="COMPLEXITY" label="Complexity">
            <Select disabled={isViewMode} placeholder="Select complexity">
              <Option value="1">Low</Option>
              <Option value="2">Medium</Option>
              <Option value="3">High</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Resource" open={isModalVisible} onOk={() => setIsModalVisible(false)} onCancel={() => setIsModalVisible(false)} footer={[<Button key="close" type="primary" onClick={() => setIsModalVisible(false)}>Close</Button>]} width={1200}>
        <p>{textmodal}</p>
      </Modal>
    </div>
  );
};

export default AddResource;
