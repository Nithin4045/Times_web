// src/app/[locale]/admin/batch/page.tsx
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
  DatePicker,
  message,
  Popconfirm,
  Switch,
  Spin,
} from "antd";
import dayjs from "dayjs";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

type BatchRow = {
  id: number;
  batch_code: string;
  batch_description?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  center_id?: number | null;
  center_name?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  status: boolean;
  merged_batch?: number | null;
  merged_batch_name?: string | null;
  start_date?: string | null;
  validity_date?: string | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // lookups
  const [cities, setCities] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<BatchRow[]>([]);

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BatchRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // merge modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergingBatch, setMergingBatch] = useState<BatchRow | null>(null);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [mergeForm] = Form.useForm();

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

  // fetch paginated batches
  const fetchBatches = useCallback(async (p = page, ps = pageSize) => {
    try {
      setListLoading(true);
      const res = await fetch(`/api/admin/batches?page=${p}&pageSize=${ps}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setBatches(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total ?? 0));
      setPage(p);
      setPageSize(ps);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to fetch batches");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize]);

  // lookups fetchers
  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/city");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) setCities(json.data ?? []);
    } catch (e) { /* ignore */ }
  };
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) setCourses(json.data ?? []);
    } catch (e) { /* ignore */ }
  };
  const fetchCentersForCity = async (city_id?: number | null) => {
    if (!city_id) {
      setCenters([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/centers?city_id=${city_id}`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) setCenters(json.data ?? []);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchBatches(1, pageSize);
    // fetch lookups once
    fetchCities();
    fetchCourses();
  }, []); // eslint-disable-line

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (rec: BatchRow) => {
    setEditing(rec);
    form.setFieldsValue({
      id: rec.id,
      batch_code: rec.batch_code,
      batch_description: rec.batch_description,
      city_id: rec.city_id ?? undefined,
      center_id: rec.center_id ?? undefined,
      course_id: rec.course_id ?? undefined,
      status: rec.status,
      start_date: rec.start_date ? dayjs(rec.start_date) : null,
      validity_date: rec.validity_date ? dayjs(rec.validity_date) : null,
      merged_batch: rec.merged_batch ?? undefined,
    });
    // preload centers for that city
    fetchCentersForCity(rec.city_id ?? null);
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      const payload: any = {
        batch_code: vals.batch_code?.toString().trim(),
        batch_description: vals.batch_description ?? null,
        city_id: vals.city_id ?? null,
        center_id: vals.center_id ?? null,
        course_id: vals.course_id ?? null,
        start_date: vals.start_date ? vals.start_date.toISOString() : null,
        validity_date: vals.validity_date ? vals.validity_date.toISOString() : null,
        status: vals.status === undefined ? true : Boolean(vals.status),
      };

      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/admin/batches", {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Update failed (${res.status})`);
        message.success("Batch updated");
      } else {
        const res = await fetch("/api/admin/batches", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Create failed (${res.status})`);
        message.success("Batch created");
      }
      setModalOpen(false);
      fetchBatches(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/batches?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Batch deleted");
      fetchBatches(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBatches = async () => {
    try {
      // Fetch all batches without pagination for merge dropdown
      const res = await fetch(`/api/admin/batches?page=1&pageSize=10000`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success === true) {
        setAllBatches(Array.isArray(json.data) ? json.data : []);
      }
    } catch (e) {
      console.log("Failed to fetch all batches for merge");
    }
  };

  const openMerge = (batch: BatchRow) => {
    setMergingBatch(batch);
    mergeForm.resetFields();
    setMergeModalOpen(true);
    fetchAllBatches(); // Fetch all batches when opening merge modal
  };

  const doMerge = async () => {
    if (!mergingBatch) return;
    
    try {
      setMergeSubmitting(true);
      const vals = await mergeForm.validateFields();
      const targetBatchId = vals.targetBatchId;
      
      const res = await fetch("/api/admin/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceBatchId: mergingBatch.id,
          targetBatchId: targetBatchId
        }),
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Merge failed (${res.status})`);
      }
      
      message.success(json?.message || "Batch merged successfully");
      setMergeModalOpen(false);
      fetchBatches(1, pageSize);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to merge batch");
    } finally {
      setMergeSubmitting(false);
    }
  };

  const columns = [
    { title: "Batch Code", dataIndex: "batch_code", key: "batch_code", ...getColumnSearchProps("batch_code") },
    { title: "Batch Name", dataIndex: "batch_description", key: "batch_description", render: (v:any) => v ?? "-", ...getColumnSearchProps("batch_description") },
    { title: "City", dataIndex: "city_name", key: "city_name", render:(v:any) => v ?? "-", ...getColumnSearchProps("city_name") },
    { title: "Center", dataIndex: "center_name", key: "center_name", render:(v:any)=> v ?? "-", ...getColumnSearchProps("center_name") },
    { title: "Course", dataIndex: "course_name", key: "course_name", render:(v:any)=> v ?? "-", ...getColumnSearchProps("course_name") },
    { title: "Status", dataIndex: "status", key: "status", render: (v:boolean) => v ? "Active" : "Inactive", ...getColumnSearchProps("status") },
    { title: "Merged Batch", dataIndex: "merged_batch_name", key: "merged_batch_name", render:(v:any)=> v ?? "-", ...getColumnSearchProps("merged_batch_name") },
    { title: "Start Date", dataIndex: "start_date", key: "start_date", render:(v:any)=> v ? new Date(v).toLocaleString() : "-", ...getColumnSearchProps("start_date") },
    { title: "Validity Date", dataIndex: "validity_date", key: "validity_date", render:(v:any)=> v ? new Date(v).toLocaleString() : "-", ...getColumnSearchProps("validity_date") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      render: (_: any, rec: BatchRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm title="Delete batch?" onConfirm={() => doDelete(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
          <Button size="small" onClick={() => openMerge(rec)}>Merge</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Batches</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Batch</Button>
        </Space>
      </div>

      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          dataSource={batches}
          columns={columns}
          loading={listLoading || loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => fetchBatches(p, ps),
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Batch" : "Add Batch"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ status: true }}>
          <Form.Item name="id" hidden><Input/></Form.Item>

          <Form.Item name="batch_code" label="Batch Code" rules={[{ required: true, message: "Enter batch code" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="batch_description" label="Batch Name">
            <Input />
          </Form.Item>

          <Form.Item name="city_id" label="City" rules={[{ required: true, message: "Select city" }]}>
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select city"
              onChange={(val) => fetchCentersForCity(Number(val))}
            >
              {cities.map((c:any) => <Select.Option key={c.id} value={c.id}>{c.city}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="center_id" label="Center" rules={[{ required: true, message: "Select center" }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select center">
              {centers.map((c:any) => <Select.Option key={c.id} value={c.id}>{c.center}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="course_id" label="Course" rules={[{ required: true, message: "Select course" }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select course">
              {courses.map((c:any) => <Select.Option key={c.id} value={c.id}>{c.coursename}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="start_date" label="Start Date">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="validity_date" label="Validity Date">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="status" label="Status" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Merge Modal */}
      <Modal
        title={`Merge Batch: ${mergingBatch?.batch_code || ""}`}
        open={mergeModalOpen}
        onCancel={() => setMergeModalOpen(false)}
        onOk={doMerge}
        confirmLoading={mergeSubmitting}
        destroyOnHidden
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item 
            name="targetBatchId" 
            label="Select Target Batch to Merge Into"
            rules={[{ required: true, message: "Please select a target batch" }]}
          >
            <Select
              showSearch
              placeholder="Select target batch"
              loading={allBatches.length === 0}
              filterOption={(input, option) => {
                const label = String(option?.label || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {allBatches
                .filter(batch => batch.id !== mergingBatch?.id) // Exclude current batch
                .map((batch) => (
                  <Select.Option key={batch.id} value={batch.id}>
                    {batch.batch_code} - {batch.batch_description || "No description"}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          
          <div style={{ 
            padding: "12px", 
            background: "#f6f6f6", 
            borderRadius: "6px",
            marginTop: "16px"
          }}>
            <Typography.Text type="secondary">
              <strong>Note:</strong> This will merge "{mergingBatch?.batch_code}" into the selected target batch. 
              The source batch will be marked as merged and cannot be used independently.
            </Typography.Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
}


