// src/app/[locale]/admin/study_resources/page.tsx
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
} from "antd";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

type ResourceRow = {
  id: number;
  category?: string | null;
  title: string;
  link_url?: string | null;
  content?: string | null;
  page_id?: string | null;
  type: string;
  course_id: number[];
  city_id: number[];
  category_id: number[];
  accordion_content?: string | null;
  created_at: string;
  updated_at: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // lookups
  const [courses, setCourses] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
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

  const fetchResources = useCallback(async (p = page, ps = pageSize) => {
    try {
      setListLoading(true);
      const res = await fetch(`/api/admin/study-resources?page=${p}&pageSize=${ps}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setResources(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total ?? 0));
      setCourses(Array.isArray(json.lookups?.courses) ? json.lookups.courses : []);
      setCities(Array.isArray(json.lookups?.cities) ? json.lookups.cities : []);
      setPage(p);
      setPageSize(ps);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to fetch resources");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchResources(1, pageSize);
  }, []); // eslint-disable-line

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (rec: ResourceRow) => {
    setEditing(rec);
    form.setFieldsValue({
      id: rec.id,
      category: rec.category,
      title: rec.title,
      link_url: rec.link_url,
      content: rec.content,
      page_id: rec.page_id,
      type: rec.type,
      accordion_content: rec.accordion_content,
      course_id: rec.course_id,
      city_id: rec.city_id,
      category_id: rec.category_id,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      const payload: any = {
        title: vals.title?.trim(),
        type: vals.type?.trim(),
        category: vals.category?.trim() || null,
        link_url: vals.link_url?.trim() || null,
        content: vals.content || null,
        page_id: vals.page_id?.trim() || null,
        accordion_content: vals.accordion_content || null,
        course_id: vals.course_id ?? [],
        city_id: vals.city_id ?? [],
        category_id: vals.category_id ?? [],
      };

      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/admin/study-resources", {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Update failed (${res.status})`);
        message.success("Resource updated");
      } else {
        const res = await fetch("/api/admin/study-resources", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Create failed (${res.status})`);
        message.success("Resource created");
      }
      setModalOpen(false);
      fetchResources(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/study-resources?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Resource deleted");
      fetchResources(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
    { title: "Title", dataIndex: "title", key: "title", width: 250, ellipsis: true, ...getColumnSearchProps("title") },
    { title: "Type", dataIndex: "type", key: "type", width: 120, ...getColumnSearchProps("type") },
    { title: "Category", dataIndex: "category", key: "category", width: 150, render: (v:any) => v || "-", ...getColumnSearchProps("category") },
    { title: "Link URL", dataIndex: "link_url", key: "link_url", width: 200, ellipsis: true, render: (v:any) => v || "-", ...getColumnSearchProps("link_url") },
    { title: "Page ID", dataIndex: "page_id", key: "page_id", width: 120, render: (v:any) => v || "-", ...getColumnSearchProps("page_id") },
    {
      title: "Courses",
      dataIndex: "course_id",
      key: "course_id",
      width: 120,
      render: (arr: number[]) => arr && arr.length ? `${arr.length} course(s)` : "-",
      ...getColumnSearchProps("course_id"),
      onFilter: (value: any, record: any) => {
        const ids = record.course_id ? record.course_id.join(", ") : "";
        return ids.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Cities",
      dataIndex: "city_id",
      key: "city_id",
      width: 120,
      render: (arr: number[]) => arr && arr.length ? `${arr.length} city(s)` : "-",
      ...getColumnSearchProps("city_id"),
      onFilter: (value: any, record: any) => {
        const ids = record.city_id ? record.city_id.join(", ") : "";
        return ids.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: any, rec: ResourceRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm title="Delete resource?" onConfirm={() => doDelete(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Study Resources</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Resource</Button>
        </Space>
      </div>

      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          dataSource={resources}
          columns={columns}
          loading={listLoading || loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => fetchResources(p, ps),
          }}
          scroll={{ x: 1600 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Resource" : "Add Resource"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input/></Form.Item>

          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Enter title" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Enter type" }]}>
            <Input placeholder="e.g., video, article, pdf, etc." />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>

          <Form.Item name="link_url" label="Link URL">
            <Input />
          </Form.Item>

          <Form.Item name="page_id" label="Page ID">
            <Input />
          </Form.Item>

          <Form.Item name="content" label="Content">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item name="accordion_content" label="Accordion Content">
            <TextArea rows={3} />
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

          <Form.Item name="city_id" label="Cities">
            <Select
              mode="multiple"
              placeholder="Select cities"
              showSearch
              optionFilterProp="children"
            >
              {cities.map((c:any) => <Select.Option key={c.id} value={c.id}>{c.city}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="category_id" label="Category IDs">
            <Select
              mode="tags"
              placeholder="Enter category IDs"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

