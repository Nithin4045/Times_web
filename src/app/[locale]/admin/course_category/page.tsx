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
  Modal,
  Form,
  Input,
  Popconfirm,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

const { Title, Paragraph } = Typography;

function safeAtob(str) { try { return atob(str); } catch { return ""; } }
function safeBtoa(str) { try { return btoa(str); } catch { return ""; } }
function encodeJsonParam(obj) { const text = JSON.stringify(obj ?? {}); return encodeURIComponent(safeBtoa(text)); }
function decodeJsonParam(paramVal) { if (!paramVal) return null; const text = safeAtob(decodeURIComponent(paramVal)); try { return JSON.parse(text); } catch { return null; } }

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  const formName = useMemo(() => searchParams.get("formName") || "course_category_form", [searchParams]);

  const apiBase = "/api/admin/course_categories"; // keep in sync with route file

  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
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

  const lastSubmitRef = useRef<string | null>(null);
  const makeFingerprint = (env: any) =>
    env?.ts ? `ts:${env.ts}` : `data:${JSON.stringify(env?.data || {})}`;

  const fetchCategories = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load categories");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const saveCategory = async (data) => {
    setSaving(true);
    setErrorMsg("");
    setSaveOk(false);
    try {
      const fd = new FormData();
      fd.append("category", (data.category ?? "").toString().trim());
      const userId = session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;
      if (userId != null) fd.append("created_by", String(userId));

      const res = await fetch(apiBase, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Save failed (${res.status})`);

      setSaveOk(true);
      message.success("Category saved successfully");
      fetchCategories();
    } catch (e: any) {
      const msg = e?.message || "Failed to save category";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const startAddCategory = async () => {
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

      if (Array.isArray(schema.fields)) {
        const hasCategory = schema.fields.some(f => f.key === "category");
        if (!hasCategory) {
          schema = {
            ...schema,
            fields: [
              { key: "category", span: 1, type: "text", label: "Category", required: true, placeholder: "Enter category name" },
              ...schema.fields,
            ],
          };
        }
        if (!schema.layout) schema.layout = { cols: 1, gutter: 16 };
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

  useEffect(() => {
    const encoded = searchParams.get("data");
    if (!encoded) return;
    const env = decodeJsonParam(encoded);
    if (env?.type === "DYNAMIC_FORM_SUBMIT") {
      const fp = makeFingerprint(env);
      if (lastSubmitRef.current === fp) return;
      lastSubmitRef.current = fp;

      if (env.data) saveCategory(env.data);

      const clean = formName ? `${pathname}?formName=${encodeURIComponent(formName)}` : pathname;
      router.replace(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- Actions: Edit + Delete ---
  const openEdit = (record: any) => {
    setEditId(record?.id ?? null);
    editForm.setFieldsValue({ category: record?.category ?? "" });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      setEditSubmitting(true);
      const values = await editForm.validateFields();

      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          category: (values.category ?? "").trim(),
          // optionally include updated_by if you want:
          // updated_by: session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        if (res.status === 409) {
          const fld = json?.field ? ` (${json.field})` : "";
          throw new Error(json?.error ? `${json.error}${fld}` : "Duplicate value");
        }
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Category updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchCategories();
    } catch (e: any) {
      message.error(e?.message || "Failed to update category");
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteCategory = async (id: number) => {
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
      message.success("Category deleted");
      fetchCategories();
    } catch (e: any) {
      message.error(e?.message || "Failed to delete category");
    }
  };

  const columns = [
    {
      title: "ID",
      key: "serial",
      render: (_v, _record, index) => index + 1,
      width: 60,
    },
    { title: "Category", dataIndex: "category", key: "category", ...getColumnSearchProps("category") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this category?"
            description={`Are you sure you want to delete "${record.category}"?`}
            onConfirm={() => deleteCategory(record.id)}
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
        <Title level={3} className={styles.title}>Categories</Title>
        <Space>
          <Button type="primary" onClick={startAddCategory} loading={flowLoading}>
            Add Category
          </Button>
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
      />

      {saving && (
        <div className={styles.feedback}>
          <Spin />
          <Paragraph style={{ margin: 0 }}>Saving category…</Paragraph>
        </div>
      )}

      {!saving && saveOk && (
        <Alert
          type="success"
          showIcon
          message="Category saved"
          description="The category was saved and the list has been refreshed."
          className={styles.feedback}
        />
      )}

      <Modal
        title="Edit Category"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditId(null); }}
        okText="Save"
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
