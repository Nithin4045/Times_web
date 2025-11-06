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

// ---- helpers: base64 <-> json ----
function safeAtob(str) { try { return atob(str); } catch { return ""; } }
function safeBtoa(str) { try { return btoa(str); } catch { return ""; } }
function encodeJsonParam(obj) {
  const text = JSON.stringify(obj ?? {});
  return encodeURIComponent(safeBtoa(text));
}
function decodeJsonParam(paramVal) {
  if (!paramVal) return null;
  const text = safeAtob(decodeURIComponent(paramVal));
  try { return JSON.parse(text); } catch { return null; }
}

export default function VariantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  const formName = useMemo(() => searchParams.get("formName") || "variant_form", [searchParams]);

  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit modal state
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

  const apiBase = "/api/admin/variants";

  // ---- fetch variants for table ----
  const fetchVariants = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load variants");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  // ---- POST /api/admin/variants after returning from dynamic_form ----
  const saveVariant = async (data) => {
    setSaving(true);
    setErrorMsg("");
    setSaveOk(false);

    try {
      const fd = new FormData();
      fd.append("variant", (data.variant ?? "").toString().trim());
      fd.append("description", (data.description ?? "").toString().trim());

      const userId =
        session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;
      if (userId != null) fd.append("updated_by", String(userId));

      const res = await fetch(apiBase, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      setSaveOk(true);
      message.success("Variant saved successfully");
      fetchVariants();
    } catch (e: any) {
      const msg = e?.message || "Failed to save variant";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- open dynamic form (ensure fields exist) ----
  const startAddVariant = async () => {
    setFlowLoading(true);
    setErrorMsg("");

    try {
      if (!formName) throw new Error("Missing formName in URL.");

      const fd = new FormData();
      fd.append("name", formName);
      const userId =
        session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;
      if (userId != null) fd.append("update_id", String(userId));

      const res = await fetch("/api/get_forms", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Fetch form failed (${res.status})`);

      const payload = await res.json();
      let schema = payload?.schema || payload?.data?.schema || payload?.data?.formjson || payload?.formjson;
      let initial = payload?.initial || payload?.data?.initial || {};

      if (!schema) throw new Error("Form schema not found.");

      if (Array.isArray(schema.fields)) {
        const hasVariant = schema.fields.some(f => f.key === "variant");
        const hasDesc = schema.fields.some(f => f.key === "description");
        let fields = schema.fields.slice();

        if (!hasVariant) {
          fields.unshift({
            key: "variant",
            span: 1,
            type: "text",
            label: "Variant",
            required: true,
            placeholder: "Enter variant name",
          });
        }
        if (!hasDesc) {
          fields.push({
            key: "description",
            span: 2,
            type: "textarea",
            label: "Description",
            rows: 3,
            placeholder: "Short description",
          });
        }

        schema = { ...schema, fields };
        if (!schema.layout) schema.layout = { cols: 2, gutter: 16 };
      }

      const params = new URLSearchParams({
        schema: encodeJsonParam(schema),
        initial: encodeJsonParam(initial),
        mode: "redirect",
        returnUrl: pathname,
        formId: formName,
      });

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

      if (env.data) {
        // eslint-disable-next-line no-console
        console.log("SUBMITTED VARIANT DATA:", env.data);
        saveVariant(env.data);
      }

      const clean = formName ? `${pathname}?formName=${encodeURIComponent(formName)}` : pathname;
      router.replace(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- edit handlers ----
  const openEdit = (record: any) => {
    setEditId(record?.id ?? null);
    editForm.setFieldsValue({
      variant: record?.variant ?? "",
      description: record?.description ?? "",
    });
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
          variant: (values.variant ?? "").trim(),
          description: (values.description ?? "").trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Variant updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchVariants();
    } catch (e: any) {
      message.error(e?.message || "Failed to update variant");
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteVariant = async (id: number) => {
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
      message.success("Variant deleted");
      fetchVariants();
    } catch (e: any) {
      message.error(e?.message || "Failed to delete variant");
    }
  };

  // ---- table columns (now with Actions) ----
  const columns = [
    {
      title: "ID",
      key: "serial",
      render: (_v, _record, index) => index + 1,
      width: 60,
    },
    { title: "Variant", dataIndex: "variant", key: "variant", ...getColumnSearchProps("variant") },
    { title: "Description", dataIndex: "description", key: "description", ...getColumnSearchProps("description") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this variant?"
            description={`Are you sure you want to delete "${record.variant}"?`}
            onConfirm={() => deleteVariant(record.id)}
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
        <Title level={3} className={styles.title}>Variants</Title>
        <Space>
          <Button type="primary" onClick={startAddVariant} loading={flowLoading}>
            Add Variant
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
        className={styles.table}
      />

      {saving && (
        <div className={styles.feedback}>
          <Spin />
          <Paragraph style={{ margin: 0 }}>Saving variant…</Paragraph>
        </div>
      )}

      {!saving && saveOk && (
        <Alert
          type="success"
          showIcon
          message="Variant saved"
          description="The variant was saved and the list has been refreshed."
          className={styles.feedback}
        />
      )}

      <Modal
        title="Edit Variant"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditId(null); }}
        okText="Save"
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Variant" name="variant" rules={[{ required: true, message: "Variant is required" }]}>
            <Input placeholder="Variant" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Short description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
