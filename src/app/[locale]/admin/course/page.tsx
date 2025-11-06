// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Typography,
  Alert,
  Spin,
  Button,
  message,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Select,
  Popconfirm,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams, usePathname, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import styles from "./page.module.css";



const { Title, Paragraph } = Typography;

// ---- helpers: base64 <-> json ----
function safeAtob(str) { try { return atob(str); } catch { return ""; } }
function safeBtoa(str) { try { return btoa(str); } catch { return ""; } }
function encodeJsonParam(obj) { const text = JSON.stringify(obj ?? {}); return encodeURIComponent(safeBtoa(text)); }
function decodeJsonParam(paramVal) { if (!paramVal) return null; const text = safeAtob(decodeURIComponent(paramVal)); try { return JSON.parse(text); } catch { return null; } }

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale } = useParams(); 

  const formName = useMemo(() => searchParams.get("formName") || "courses_form", [searchParams]);

  const apiBase = "/api/admin/courses";

  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

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

  // prevent double-save on the same return payload
  const lastSubmitRef = useRef<string | null>(null);
  const makeFingerprint = (env: any) =>
    env?.ts ? `ts:${env.ts}` : `data:${JSON.stringify(env?.data || {})}`;

  // ---- fetch courses for table ----
  const fetchCourses = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      const raw = await res.text();
      let json: any = null;
      try { json = raw ? JSON.parse(raw) : null; } catch { }
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load courses");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ---- POST after returning from dynamic_form ----
  const saveCourse = async (data) => {
    setSaving(true);
    setErrorMsg("");
    setSaveOk(false);

    try {
      const fd = new FormData();
      fd.append("coursename", (data.coursename ?? "").toString().trim());
      if (data.price != null) fd.append("price", String(data.price));
      fd.append("image", (data.image ?? "").toString().trim());
      if (typeof data.active !== "undefined") fd.append("active", data.active ? "true" : "false");
      if (data.offerendtime) fd.append("offerendtime", data.offerendtime.toString());
      if (data.offerprice != null) fd.append("offerprice", String(data.offerprice));
      if (data.offerpercent != null) fd.append("offerpercent", String(data.offerpercent));
      fd.append("type", (data.type ?? "").toString().trim());
      const userId = session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;
      if (userId != null) fd.append("created_by", String(userId));

      const res = await fetch(apiBase, { method: "POST", body: fd });
      const raw = await res.text();
      let json: any = null; try { json = raw ? JSON.parse(raw) : null; } catch { }
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      setSaveOk(true);
      message.success("Course saved successfully");
      fetchCourses();
    } catch (e: any) {
      const msg = e?.message || "Failed to save course";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- open dynamic form ----
  const startAddCourse = async () => {
    setFlowLoading(true);
    setErrorMsg("");
    try {
      if (!formName) throw new Error("Missing formName in URL.");
      const fd = new FormData();
      fd.append("name", formName);
      const res = await fetch("/api/get_forms", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Fetch form failed (${res.status})`);

      const payload = await res.json();
      let schema = payload?.schema || payload?.data?.schema || payload?.data?.formjson || payload?.formjson;
      let initial = payload?.initial || payload?.data?.initial || {};
      if (!schema) throw new Error("Form schema not found.");

      // ensure required fields
      const ensureField = (arr, descriptor) => (arr.some(f => f.key === descriptor.key) ? arr : [...arr, descriptor]);
      if (Array.isArray(schema.fields)) {
        let fields = schema.fields.slice();
        fields = ensureField(fields, { key: "coursename", span: 2, type: "text", label: "Course Name", required: true });
        fields = ensureField(fields, { key: "price", span: 1, type: "number", label: "Price", required: true });
        fields = ensureField(fields, { key: "image", span: 1, type: "text", label: "Image" });
        fields = ensureField(fields, { key: "active", span: 1, type: "checkbox", label: "Active" });
        fields = ensureField(fields, { key: "offerendtime", span: 1, type: "datetime", label: "Offer End Time" });
        fields = ensureField(fields, { key: "offerprice", span: 1, type: "number", label: "Offer Price" });
        fields = ensureField(fields, { key: "offerpercent", span: 1, type: "number", label: "Offer Percent" });
        fields = ensureField(fields, {
          key: "type", span: 1, type: "select", label: "Type", required: true,
          options: [{ label: "Paid", value: "paid" }, { label: "Free", value: "free" }],
        });
        schema = { ...schema, fields };
        if (!schema.layout) schema.layout = { cols: 2, gutter: 16 };
        if (!schema.title) schema.title = "Course Settings";
      }

      const params = new URLSearchParams({
        schema: encodeJsonParam(schema),
        initial: encodeJsonParam(initial),
        mode: "redirect",
        returnUrl: pathname,
        formId: formName,
      });

      message.destroy();
      router.push(`/dynamic_form?${params.toString()}`);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to open form.");
    } finally {
      setFlowLoading(false);
    }
  };

  // ---- handle return from dynamic_form ----
  useEffect(() => {
    const encoded = searchParams.get("data");
    if (!encoded) return;
    const env = decodeJsonParam(encoded);
    if (env?.type === "DYNAMIC_FORM_SUBMIT") {
      const fp = makeFingerprint(env);
      if (lastSubmitRef.current === fp) return;
      lastSubmitRef.current = fp;

      if (env.data) saveCourse(env.data);

      const clean = formName ? `${pathname}?formName=${encodeURIComponent(formName)}` : pathname;
      router.replace(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- Actions: Edit + Delete ----
  const openEdit = (record: any) => {
    setEditId(record?.id ?? null);
    editForm.setFieldsValue({
      coursename: record?.coursename ?? "",
      price: record?.price ?? null,
      image: record?.image ?? "",
      active: !!record?.active,
      offerendtime: record?.offerendtime ? dayjs(record.offerendtime) : null,
      offerprice: record?.offerprice ?? null,
      offerpercent: record?.offerpercent ?? null,
      type: record?.type ?? undefined,
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      setEditSubmitting(true);
      const values = await editForm.validateFields();

      const body = {
        id: editId,
        coursename: (values.coursename ?? "").trim(),
        price: values.price != null ? Number(values.price) : undefined,
        image: (values.image ?? "").trim(),
        active: !!values.active,
        offerendtime: values.offerendtime ? values.offerendtime.toISOString() : null,
        offerprice: values.offerprice != null ? Number(values.offerprice) : null,
        offerpercent: values.offerpercent != null ? Number(values.offerpercent) : null,
        type: values.type || null,
      };

      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Course updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchCourses();
    } catch (e: any) {
      message.error(e?.message || "Failed to update course");
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteCourse = async (id: number) => {
    try {
      const res = await fetch(apiBase, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      message.success("Course deleted");
      fetchCourses();
    } catch (e: any) {
      message.error(e?.message || "Failed to delete course");
    }
  };

  // ---- table columns (now with Actions) ----
  const columns = [
    { title: "ID", key: "serial", render: (_v, _r, i) => i + 1, width: 60 },
    { title: "Course", dataIndex: "coursename", key: "coursename", ...getColumnSearchProps("coursename") },
    { title: "Type", dataIndex: "type", key: "type", render: (v) => v ? <Tag>{String(v).toUpperCase()}</Tag> : "", width: 100, ...getColumnSearchProps("type") },
    { title: "Active", dataIndex: "active", key: "active", render: (v) => (v ? <Tag color="green">YES</Tag> : <Tag>NO</Tag>), width: 100 },
    { title: "Price", dataIndex: "price", key: "price", render: (v) => (v != null ? Number(v).toLocaleString() : ""), width: 120, ...getColumnSearchProps("price") },
    { title: "Offer Price", dataIndex: "offerprice", key: "offerprice", width: 130, ...getColumnSearchProps("offerprice") },
    { title: "Offer %", dataIndex: "offerpercent", key: "offerpercent", width: 110, ...getColumnSearchProps("offerpercent") },
    { title: "Offer Ends", dataIndex: "offerendtime", key: "offerendtime", render: (v) => (v ? new Date(v).toLocaleString() : ""), width: 200, ...getColumnSearchProps("offerendtime") },
    { title: "Image", dataIndex: "image", key: "image", ...getColumnSearchProps("image") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this course?"
            description={`Are you sure you want to delete "${record.coursename}"?`}
            onConfirm={() => deleteCourse(record.id)}
            okButtonProps={{ danger: true }}
            okText="Delete"
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Courses</Title>
        <Space>
          <Button type="primary" onClick={startAddCourse} loading={flowLoading}>Add Course</Button>
        </Space>
      </div>

      {!!errorMsg && (
        <Alert type="error" showIcon message="Error" description={errorMsg} className={styles.error} />
      )}

      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={tableLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        className={styles.table}
      />

      {saving && (
        <div className={styles.feedback}>
          <Spin />
          <Paragraph style={{ margin: 0 }}>Saving course…</Paragraph>
        </div>
      )}

      {!saving && saveOk && (
        <Alert
          type="success"
          showIcon
          message="Course saved"
          description="The course was saved and the list has been refreshed."
          className={styles.feedback}
        />
      )}

      <Modal
        title="Edit Course"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditId(null); }}
        okText="Save"
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Course Name" name="coursename" rules={[{ required: true, message: "Course name is required" }]}>
            <Input placeholder="Course name" />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true, message: "Type is required" }]}>
            <Select options={[{ label: "Paid", value: "paid" }, { label: "Free", value: "free" }]} placeholder="Select type" />
          </Form.Item>
          <Form.Item label="Price" name="price" rules={[{ required: true, message: "Price is required" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Active" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Image" name="image">
            <Input placeholder="Image filename or URL" />
          </Form.Item>
          <Form.Item label="Offer End Time" name="offerendtime">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Offer Price" name="offerprice">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Offer Percent" name="offerpercent">
            <InputNumber style={{ width: "100%" }} min={0} max={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
