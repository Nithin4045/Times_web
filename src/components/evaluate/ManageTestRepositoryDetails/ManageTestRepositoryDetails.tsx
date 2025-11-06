"use client";

import {
  Modal,
  Form,
  message,
  Table,
  Button,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AddTestRepositoryDetails from "./AddTestRepositoryDetails";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import "@/app/global.css";

interface Subject {
  repository_details_id: number;
  subject_id: number;
  TOPIC_ID: number;
  question_count: number;
  duration_min: number;
  rendering_order: number;
  selection_method: string;
  subject_marks: number;
  test_id: number;

  // optional fields that your columns reference
 SUBJECT_DESCRIPTION?: string | null;
  TOPIC_DESCRIPTION?: string | null;
  TOPIC_CODE?: string | null;
  negative_marks?: number;


  require_resource?: number | string | null;   // server may return 0/1 or "0"/"1"
  REQUIRE_RESOURCE?: number | string | null;
}

interface ManageTestRepositoryDetailsProps {
  open: boolean;
  onClose: () => void;
  test_id: number;
  onOk?: () => void;
  onCancel?: () => void;
}

export default function ManageTestRepositoryDetails({
  open,
  onClose,
  test_id,
}: ManageTestRepositoryDetailsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [data, setData] = useState<Subject[]>([]);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [repository_details_id, setRepositoryDetailsId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/evaluate/Admin/ManageTestRepositoryDetails?test_id=${test_id}`
      );

      // HARDEN: always store an array
      const payload = res?.data;

      let rows: Subject[] = [];
      if (Array.isArray(payload)) {
        rows = payload as Subject[];
      } else if (payload && Array.isArray(payload.rows)) {
        rows = payload.rows as Subject[];
      } else if (payload && Array.isArray(payload.data)) {
        rows = payload.data as Subject[];
      } else if (payload == null) {
        rows = [];
      } else {
        // Unexpected shape — help future-debugging
        console.warn(
          "[ManageTestRepositoryDetails] Expected array but got:",
          payload
        );
        rows = [];
      }

      setData(rows);
    } catch (err) {
      message.error("Failed to load subjects");
      setData([]); // keep it an array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchData();
  }, [open, test_id]); // include test_id to refetch if modal opens for a different test

  const handleAddSave = async () => {
    try {
      const values = await form.validateFields();
      const newSubject: Subject = {
        ...(editingSubject ?? ({} as Subject)),
        ...values,
        repository_details_id: repository_details_id as number,
        test_id,
      };

      if (editingSubject) {
        await axios.put(
          `/api/ManageTestRepositoryDetails/${editingSubject.repository_details_id}`,
          newSubject
        );
        message.success("Subject updated successfully!");
      } else {
        // If you have a POST endpoint, call it here. For now, just optimistic add:
        // await axios.post(`/api/ManageTestRepositoryDetails`, newSubject);
        message.success("Subject added!");
      }

      setIsAddModalOpen(false);
      setEditingSubject(null);
      setRepositoryDetailsId(null);
      form.resetFields();
      fetchData();
    } catch {
      // validateFields or request failed
      // message is already shown in catch for request, keep quiet here
    }
  };

  // const handleEdit = (record: Subject) => {
  //   form.setFieldsValue(record);
  //   setEditingSubject(record);
  //   setRepositoryDetailsId(record.repository_details_id);
  //   setIsAddModalOpen(true);
  // };

  const handleEdit = (record: Subject) => {
  // Normalise ring-fenced property names used by the child form
  const mappedValues = {
    subjectid: record.subject_id,
    topicid: record.TOPIC_ID,
    questioncount: record.question_count,
    duration_min: record.duration_min,
    rendering_order: record.rendering_order,
    selection_method: (record.selection_method ?? "").toString().toUpperCase(),
    subject_marks: record.subject_marks,
    negative_marks: record.negative_marks,
    REQUIRE_RESOURCE: record.require_resource ?? (record as any).REQUIRE_RESOURCE ?? 0,
  };

  // set the fields using the names expected by AddTestRepositoryDetails
  form.setFieldsValue(mappedValues);

  // keep the existing state behavior
  setEditingSubject(record);
  setRepositoryDetailsId(record.repository_details_id);
  setIsAddModalOpen(true);
};


  const handleDelete = async (record: Subject) => {
    try {
      console.log('handleDelete record:',record);
      await axios.delete(
        `/api/evaluate/Admin/ManageTestRepositoryDetails/${record.repository_details_id}`,
        { data: { repository_details_id: record.repository_details_id } }
      );
      message.success("Deleted successfully");
      fetchData();
    } catch {
      message.error("Failed to delete");
    }
  };

  const columns: ColumnsType<Subject> = useMemo(
    () => [
      {
        title: "Subject",
        dataIndex: "SUBJECT_DESCRIPTION",
        key: "SUBJECT_DESCRIPTION",
      },
      {
        title: "Topic Name",
        dataIndex: "TOPIC_DESCRIPTION",
        key: "TOPIC_DESCRIPTION",
      },
      {
        title: "Topic Code",
        dataIndex: "TOPIC_CODE",
        key: "TOPIC_CODE",
      },
      {
        title: "Question Count",
        dataIndex: "question_count",
        key: "question_count",
      },
      {
        title: "Duration (min)",
        dataIndex: "duration_min",
        key: "duration_min",
      },
      {
        title: "Section Order",
        dataIndex: "rendering_order",
        key: "rendering_order",
        render: (value: number) => ((value ?? 0) / 10).toFixed(0),
      },
      {
        title: "Selection Method",
        dataIndex: "selection_method",
        key: "selection_method",
      },
      {
        title: "Subject Marks",
        dataIndex: "subject_marks",
        key: "subject_marks",
      },
      {
        title: "Negative Marks",
        dataIndex: "negative_marks",
        key: "negative_marks",
        render: (value: number | undefined) => (Number(value) === 1 ? "YES" : "NO"),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size={2} wrap>
            <Tooltip title="Edit">
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            </Tooltip>

            <Popconfirm
              title="Are you sure to delete this subject?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button type="link" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  // EXTRA SAFETY: ensure the Table always gets an array
  const safeData = Array.isArray(data) ? data : [];

  return (
    <>
      <Modal
        open={open}
        onCancel={() => {
          setData([]); // keep array shape when closing
          setEditingSubject(null);
          setRepositoryDetailsId(null);
          form.resetFields();
          onClose();
        }}
        footer={null}
        centered
        width="95vw"
        maskClosable={false}
        closable
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "30px",
            }}
          >
            <div className="MainTitle">
              <span className="typo-title">MANAGE TEST REPOSITORY</span>
            </div>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              className="contentaddbutton1"
              onClick={() => {
                form.resetFields();
                setEditingSubject(null);
                setRepositoryDetailsId(null);
                setIsAddModalOpen(true);
              }}
            >
              <PlusOutlined /> Add
            </button>
          </div>
        }
      >
        <Table<Subject>
          className="CC_Table"
          columns={columns}
          dataSource={safeData}
          loading={loading}
          rowKey={(record) => String(record.repository_details_id)}
          bordered
          style={{ overflowX: "auto" }}
          onRow={(record) => ({
            onClick: () => setRepositoryDetailsId(record.repository_details_id),
          })}
        />
      </Modal>

      {/* Child editor modal */}
      <AddTestRepositoryDetails
        open={isAddModalOpen}
        form={form}                // <- make sure AddTestRepositoryDetails uses <Form form={form}>
        isEdit={!!editingSubject}
        test_id={test_id}
        repository_details_id={repository_details_id ?? undefined}
        onSuccess={() => {
          setRepositoryDetailsId(null);
          fetchData();
        }}
        onCancel={() => {
          form.resetFields();
          setIsAddModalOpen(false);
          setEditingSubject(null);
          setRepositoryDetailsId(null);
        }}
        onOk={handleAddSave}
      />
    </>
  );
}
