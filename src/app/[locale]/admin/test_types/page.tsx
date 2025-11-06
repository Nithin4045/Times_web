// src/app/[locale]/admin/test_types/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
} from "antd";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

type TestTypeRow = {
  id: number;
  test_name: string;
  order: number;
  created_at?: string;
  updated_at?: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [testTypes, setTestTypes] = useState<TestTypeRow[]>([]);

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TestTypeRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // search functionality
  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
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
          <Button onClick={() => { clearFilters?.(); confirm(); }} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
  });

  const fetchTestTypes = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await fetch("/api/admin/test_types", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setTestTypes(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to fetch test types");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestTypes();
  }, []); // eslint-disable-line

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (rec: TestTypeRow) => {
    setEditing(rec);
    form.setFieldsValue({
      id: rec.id,
      test_name: rec.test_name,
      order: rec.order,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      const payload: any = {
        test_name: vals.test_name?.trim(),
        order: vals.order,
      };

      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/admin/test_types", {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Update failed (${res.status})`);
        message.success("Test type updated");
      } else {
        const res = await fetch("/api/admin/test_types", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Create failed (${res.status})`);
        message.success("Test type created");
      }
      setModalOpen(false);
      fetchTestTypes();
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/test_types?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Test type deleted");
      fetchTestTypes();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
    { title: "Test Name", dataIndex: "test_name", key: "test_name", width: 300, ...getColumnSearchProps("test_name") },
    { title: "Order", dataIndex: "order", key: "order", width: 100, ...getColumnSearchProps("order") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: any, rec: TestTypeRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm title="Delete test type?" onConfirm={() => doDelete(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Test Types</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Test Type</Button>
        </Space>
      </div>

      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          dataSource={testTypes}
          columns={columns}
          loading={listLoading || loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Test Type" : "Add Test Type"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input/></Form.Item>

          <Form.Item name="test_name" label="Test Name" rules={[{ required: true, message: "Enter test name" }]}>
            <Input placeholder="e.g., Mock Test, Practice Test" />
          </Form.Item>

          <Form.Item name="order" label="Order" rules={[{ required: true, message: "Enter order" }]}>
            <InputNumber style={{ width: "100%" }} min={0} placeholder="Display order" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

