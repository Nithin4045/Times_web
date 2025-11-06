// src/app/[locale]/admin/course_materials/page.tsx
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
  Select,
  message,
  Popconfirm,
  InputNumber,
  Tag,
} from "antd";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

type MaterialRow = {
  id: number;
  area: string;
  material_path: string;
  key_path?: string | null;
  solution_path?: string | null;
  order?: number | null;
  type: string;
  topic_name?: string | null;
  course_id: number[];
  created_at: string;
  updated_at: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // lookups
  const [courses, setCourses] = useState<any[]>([]);

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
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

  const fetchMaterials = useCallback(async (p = page, ps = pageSize) => {
    try {
      setListLoading(true);
      const res = await fetch(`/api/admin/course-materials?page=${p}&pageSize=${ps}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setMaterials(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total ?? 0));
      setCourses(Array.isArray(json.lookups?.courses) ? json.lookups.courses : []);
      setPage(p);
      setPageSize(ps);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to fetch materials");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchMaterials(1, pageSize);
  }, []); // eslint-disable-line

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (rec: MaterialRow) => {
    setEditing(rec);
    form.setFieldsValue({
      id: rec.id,
      area: rec.area,
      material_path: rec.material_path,
      key_path: rec.key_path,
      solution_path: rec.solution_path,
      order: rec.order,
      type: rec.type,
      topic_name: rec.topic_name,
      course_id: rec.course_id,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      const payload: any = {
        area: vals.area?.trim(),
        material_path: vals.material_path?.trim(),
        key_path: vals.key_path?.trim() || null,
        solution_path: vals.solution_path?.trim() || null,
        order: vals.order ?? null,
        type: vals.type,
        topic_name: vals.topic_name?.trim() || null,
        course_id: vals.course_id ?? [],
      };

      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/admin/course-materials", {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Update failed (${res.status})`);
        message.success("Material updated");
      } else {
        const res = await fetch("/api/admin/course-materials", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Create failed (${res.status})`);
        message.success("Material created");
      }
      setModalOpen(false);
      fetchMaterials(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/course-materials?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Material deleted");
      fetchMaterials(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
    { title: "Area", dataIndex: "area", key: "area", width: 150, ...getColumnSearchProps("area") },
    { title: "Material Path", dataIndex: "material_path", key: "material_path", width: 250, ellipsis: true, ...getColumnSearchProps("material_path") },
    { title: "Key Path", dataIndex: "key_path", key: "key_path", width: 200, ellipsis: true, render: (v:any) => v || "-", ...getColumnSearchProps("key_path") },
    { title: "Solution Path", dataIndex: "solution_path", key: "solution_path", width: 200, ellipsis: true, render: (v:any) => v || "-", ...getColumnSearchProps("solution_path") },
    { title: "Order", dataIndex: "order", key: "order", width: 80, render: (v:any) => v ?? "-", ...getColumnSearchProps("order") },
    { 
      title: "Type", 
      dataIndex: "type", 
      key: "type", 
      width: 180, 
      render: (v:string) => <Tag color={v === "ebook" ? "blue" : "green"}>{v}</Tag>,
      ...getColumnSearchProps("type") 
    },
    { title: "Topic Name", dataIndex: "topic_name", key: "topic_name", width: 200, render: (v:any) => v || "-", ...getColumnSearchProps("topic_name") },
    {
      title: "Courses",
      dataIndex: "course_id",
      key: "course_id",
      width: 150,
      render: (arr: number[]) => arr && arr.length ? `${arr.length} course(s)` : "-",
      ...getColumnSearchProps("course_id"),
      onFilter: (value: any, record: any) => {
        const ids = record.course_id ? record.course_id.join(", ") : "";
        return ids.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: any, rec: MaterialRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm title="Delete material?" onConfirm={() => doDelete(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Course Materials</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Material</Button>
        </Space>
      </div>

      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          dataSource={materials}
          columns={columns}
          loading={listLoading || loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => fetchMaterials(p, ps),
          }}
          scroll={{ x: 1800 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Material" : "Add Material"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input/></Form.Item>

          <Form.Item name="area" label="Area" rules={[{ required: true, message: "Enter area" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="material_path" label="Material Path" rules={[{ required: true, message: "Enter material path" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="key_path" label="Key Path">
            <Input />
          </Form.Item>

          <Form.Item name="solution_path" label="Solution Path">
            <Input />
          </Form.Item>

          <Form.Item name="order" label="Order">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Select type" }]}>
            <Select>
              <Select.Option value="ebook">E-book</Select.Option>
              <Select.Option value="reference_practice_material">Reference Practice Material</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="topic_name" label="Topic Name">
            <Input />
          </Form.Item>

          <Form.Item name="course_id" label="Courses">
            <Select
              mode="multiple"
              placeholder="Select courses"
              showSearch
              optionFilterProp="children"
            >
              {courses.map((c:any) => <Select.Option key={c.id} value={c.id}>{c.coursename}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

