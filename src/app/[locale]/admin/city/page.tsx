// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

// ---------- helpers ----------
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

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

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

  const formName = useMemo(() => searchParams.get("formName") || "", [searchParams]);
  const lastSubmitRef = useRef<string | null>(null);
  const makeFingerprint = (env: any) =>
    env?.ts ? `ts:${env.ts}` : `data:${JSON.stringify(env?.data || {})}`;

  const apiBase = "/api/admin/city"; // keep this path consistent with route.ts

  // --------- fetch table data ----------
  const fetchCities = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load cities");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  // --------- create city (via dynamic form return) ----------
  const saveCity = async (data) => {
    setSaving(true);
    setErrorMsg("");
    setSaveOk(false);

    try {
      const fd = new FormData();
      fd.append("city", (data.city ?? "").toString().trim());
      fd.append("phone", (data.phone ?? "").toString().trim());
      fd.append("name", (data.name ?? "").toString().trim());
      fd.append("email", (data.email ?? "").toString().trim());

      const userId =
        session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;
      if (userId != null) fd.append("updated_by", String(userId));

      const res = await fetch(apiBase, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success !== true) {
        if (res.status === 409) {
          const fld = json?.field ? ` (${json.field})` : "";
          throw new Error(json?.error ? `${json.error}${fld}` : "Duplicate value");
        }
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      setSaveOk(true);
      message.success("City saved successfully");
      fetchCities();
    } catch (e: any) {
      const msg = e?.message || "Failed to save city";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // --------- start dynamic form for add ----------
  const startAddCity = async () => {
    if (!formName) {
      message.error("Missing formName in URL");
      return;
    }
    setFlowLoading(true);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("name", formName);

      const res = await fetch("/api/get_forms", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const payload = await res.json();

      let schema = null;
      let initial = {};
      if (payload?.schema) schema = payload.schema;
      else if (payload?.data?.schema) schema = payload.data.schema;
      else if (payload?.data?.formjson) schema = payload.data.formjson;
      else if (payload?.formjson) schema = payload.formjson;
      initial = payload?.initial || payload?.data?.initial || {};

      if (!schema) throw new Error("Form schema not found in API response.");

      const params = new URLSearchParams({
        schema: encodeJsonParam(schema),
        initial: encodeJsonParam(initial),
        mode: "redirect",
        returnUrl: pathname,
        formId: formName,
      });

      router.replace(`/dynamic_form?${params.toString()}`);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to fetch form.");
    } finally {
      setFlowLoading(false);
    }
  };

  // --------- handle return from dynamic_form ----------
  useEffect(() => {
    const encoded = searchParams.get("data");
    if (!encoded) return;
    const env = decodeJsonParam(encoded);
    if (env?.type === "DYNAMIC_FORM_SUBMIT") {
      const fp = makeFingerprint(env);
      if (lastSubmitRef.current === fp) return;
      lastSubmitRef.current = fp;
      if (env.data) saveCity(env.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --------- edit: open modal ----------
  const openEdit = (record: any) => {
    setEditId(record?.id ?? null);
    editForm.setFieldsValue({
      city: record?.city ?? "",
      phone: record?.phone ?? "",
      name: record?.name ?? "",
      email: record?.email ?? "",
    });
    setEditOpen(true);
  };

  // --------- edit: submit ----------
  const submitEdit = async () => {
    try {
      setEditSubmitting(true);
      const values = await editForm.validateFields();

      const userId =
        session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;

      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          city: (values.city ?? "").trim(),
          phone: (values.phone ?? "").trim(),
          name: (values.name ?? "").trim(),
          email: (values.email ?? "").trim(),
          updated_by: userId ?? null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("City updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchCities();
    } catch (e: any) {
      message.error(e?.message || "Failed to update city");
    } finally {
      setEditSubmitting(false);
    }
  };

  // --------- delete ----------
  const deleteCity = async (id: number) => {
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
      message.success("City deleted");
      fetchCities();
    } catch (e: any) {
      message.error(e?.message || "Failed to delete city");
    }
  };

  // --------- columns for table ----------
  const columns = [
    {
      title: "ID",
      key: "serial",
      render: (_v, _record, index) => index + 1,
      width: 60,
    },
    { title: "City", dataIndex: "city", key: "city", ...getColumnSearchProps("city") },
    { title: "Phone", dataIndex: "phone", key: "phone", ...getColumnSearchProps("phone") },
    { title: "Name", dataIndex: "name", key: "name", ...getColumnSearchProps("name") },
    { title: "Email", dataIndex: "email", key: "email", ...getColumnSearchProps("email") },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this city?"
            description={`Are you sure you want to delete "${record.city}"?`}
            onConfirm={() => deleteCity(record.id)}
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
        <Title level={3} className={styles.title}>Cities</Title>
        <Space>
          <Button type="primary" onClick={startAddCity} loading={flowLoading}>
            Add City
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
          <Paragraph style={{ margin: 0 }}>Saving city…</Paragraph>
        </div>
      )}

      {!saving && saveOk && (
        <Alert
          type="success"
          showIcon
          message="City saved"
          description="The city was saved and the list has been refreshed."
          className={styles.feedback}
        />
      )}

      <Modal
        title="Edit City"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditId(null); }}
        okText="Save"
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="City" name="city" rules={[{ required: true, message: "City is required" }]}>
            <Input placeholder="City" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input placeholder="Phone" />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Contact person name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Valid email is required" }]}>
            <Input placeholder="Email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
