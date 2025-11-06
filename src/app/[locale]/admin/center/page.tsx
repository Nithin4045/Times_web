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
  Select,
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

export default function CentersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  const formName = useMemo(() => searchParams.get("formName") || "centers_form", [searchParams]);

  const [tableLoading, setTableLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // edit modal state
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

  // avoid double-save on the same return payload
  const lastSubmitRef = useRef<string | null>(null);
  const makeFingerprint = (env: any) =>
    env?.ts ? `ts:${env.ts}` : `data:${JSON.stringify(env?.data || {})}`;

  const apiBase = "/api/admin/centers"; // <— keep consistent with route.ts path below

  // ---- fetch centers (table) and cities (dropdown options) ----
  const fetchCenters = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }

      setRows(Array.isArray(json.data) ? json.data : []);
      const cityList = Array.isArray(json.cities) ? json.cities : [];
      setCities(cityList);
    } catch (e: any) {
      message.error(e?.message || "Failed to load centers");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  // ---- POST to /api/admin/centers after returning from dynamic_form ----
  const saveCenter = async (data) => {
    setSaving(true);
    setErrorMsg("");
    setSaveOk(false);

    try {
      const userId =
        session?.user?.id ?? session?.user?.user_id ?? session?.user?.uid ?? null;

      const fd = new FormData();
      fd.append("center", (data.center ?? "").toString().trim());
      fd.append("city_id", (data.city_id ?? "").toString().trim());
      fd.append("address", (data.address ?? "").toString().trim());
      fd.append("phone", (data.phone ?? "").toString().trim());
      fd.append("email", (data.email ?? "").toString().trim());
      fd.append("gpslink", (data.gpslink ?? "").toString().trim());
      if (userId != null) fd.append("updated_by", String(userId));

      const res = await fetch(apiBase, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      setSaveOk(true);
      message.success("Center saved successfully");
      fetchCenters(); // refresh table
    } catch (e: any) {
      const msg = e?.message || "Failed to save center";
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- open dynamic form (inject city options) ----
  const startAddCenter = async () => {
    setFlowLoading(true);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("name", formName);

      const res = await fetch("/api/get_forms", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Fetch form failed (${res.status})`);

      const payload = await res.json();
      let schema = payload?.schema || payload?.data?.schema || payload?.data?.formjson || payload?.formjson;
      let initial = payload?.initial || payload?.data?.initial || {};

      if (!schema) throw new Error("Form schema not found.");

      // city select options
      const cityOptions = (cities || []).map(c => ({ label: c.city, value: String(c.id) }));

      // inject options into city field
      if (Array.isArray(schema.fields)) {
        schema = {
          ...schema,
          fields: schema.fields.map(f =>
            f.key === "city_id" && f.type === "select"
              ? { ...f, options: cityOptions }
              : f
          ),
        };
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

      if (env.data) {
        // eslint-disable-next-line no-console
        console.log("SUBMITTED CENTER DATA:", env.data);
        saveCenter(env.data);
      }

      // clean URL (remove ?data=...) so back button won't reopen form
      const clean = formName ? `${pathname}?formName=${encodeURIComponent(formName)}` : pathname;
      router.replace(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- edit handlers ----
  const openEdit = (record: any) => {
    setEditId(record?.id ?? null);
    editForm.setFieldsValue({
      center: record?.center ?? "",
      city_id: record?.city_id ? String(record.city_id) : undefined,
      address: record?.address ?? "",
      phone: record?.phone ?? "",
      email: record?.email ?? "",
      gpslink: record?.gpslink ?? "",
    });
    setEditOpen(true);
  };

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
          center: (values.center ?? "").trim(),
          city_id: values.city_id ? Number(values.city_id) : undefined,
          address: (values.address ?? "").trim(),
          phone: (values.phone ?? "").trim(),
          email: (values.email ?? "").trim(),
          gpslink: (values.gpslink ?? "").trim(),
          updated_by: userId ?? null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        if (res.status === 409) throw new Error(json?.error || "Duplicate value");
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Center updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchCenters();
    } catch (e: any) {
      message.error(e?.message || "Failed to update center");
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteCenter = async (id: number) => {
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
      message.success("Center deleted");
      fetchCenters();
    } catch (e: any) {
      message.error(e?.message || "Failed to delete center");
    }
  };

  // ---- table columns (serial id first col) ----
  const columns = [
    {
      title: "ID",
      key: "serial",
      render: (_v, _record, index) => index + 1,
      width: 60,
    },
    { title: "Center", dataIndex: "center", key: "center", ...getColumnSearchProps("center") },
    {
      title: "City",
      key: "city",
      render: (_, r) => {
        const c = cities.find(x => x.id === r.city_id);
        return c ? c.city : r.city_id;
      },
      ...getColumnSearchProps("city"),
      onFilter: (value: any, record: any) => {
        const c = cities.find(x => x.id === record.city_id);
        const cityName = c ? c.city : String(record.city_id);
        return cityName.toString().toLowerCase().includes(value.toLowerCase());
      },
    },
    { title: "Address", dataIndex: "address", key: "address", ...getColumnSearchProps("address") },
    { title: "Phone", dataIndex: "phone", key: "phone", ...getColumnSearchProps("phone") },
    { title: "Email", dataIndex: "email", key: "email", ...getColumnSearchProps("email") },
    {
      title: "Maps",
      dataIndex: "gpslink",
      key: "gpslink",
      render: (v) => v ? <a href={v} target="_blank" rel="noreferrer">Open</a> : "",
      width: 90,
      ...getColumnSearchProps("gpslink"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this center?"
            description={`Are you sure you want to delete "${record.center}"?`}
            onConfirm={() => deleteCenter(record.id)}
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
        <Title level={3} className={styles.title}>Centers</Title>
        <Space>
          <Button type="primary" onClick={startAddCenter} loading={flowLoading}>
            Add Center
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
          <Paragraph style={{ margin: 0 }}>Saving center…</Paragraph>
        </div>
      )}

      {!saving && saveOk && (
        <Alert
          type="success"
          showIcon
          message="Center saved"
          description="The center was saved and the list has been refreshed."
          className={styles.feedback}
        />
      )}

      <Modal
        title="Edit Center"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditId(null); }}
        okText="Save"
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Center" name="center" rules={[{ required: true, message: "Center is required" }]}>
            <Input placeholder="Center name" />
          </Form.Item>
          <Form.Item label="City" name="city_id" rules={[{ required: true, message: "City is required" }]}>
            <Select
              showSearch
              options={(cities || []).map(c => ({ label: c.city, value: String(c.id) }))}
              optionFilterProp="label"
              placeholder="Select city"
            />
          </Form.Item>
          <Form.Item label="Address" name="address" rules={[{ required: true, message: "Address is required" }]}>
            <Input placeholder="Address" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input placeholder="Phone" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Valid email is required" }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Maps Link" name="gpslink" rules={[{ required: true, message: "Maps link is required" }]}>
            <Input placeholder="https://maps.google.com/..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
