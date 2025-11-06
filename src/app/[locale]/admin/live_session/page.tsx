// src/app/[locale]/admin/live_session/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { Dayjs } from "dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { RangePicker } = DatePicker;

type LiveSessionRow = {
  id: number;
  name: string | null;
  description: string | null;
  session_link: string;
  start_date_time: string | null;
  end_date_time: string | null;
  batch_codes: string[] | null;
  city_names: string[] | null;
  center_names: string[] | null;
};

type ApiResponse = {
  success: boolean;
  page: number;
  pageSize: number;
  total: number;
  data: LiveSessionRow[];
  error?: string;
};

// ✅ CHANGED: we’ll use these shapes for lookups we build client-side
type Option = { label: string; value: number };

// ✅ CHANGED: batch row shape (returned by your /api/admin/batches GET)
type BatchRow = {
  id: number;
  batch_code: string;
  batch_description: string | null;
  city_id: number | null;
  city_name: string | null;
  center_id: number | null;
  center_name: string | null;
  course_id: number | null;
  course_name: string | null;
  status: boolean;
  merged_batch: number | null;
  start_date: string | null;
  validity_date: string | null;
};

const PAGE_SIZE = 10;
const IST = "Asia/Kolkata";
const DATE_FMT = "DD-MMM-YYYY HH:mm";

export default function LiveSessionsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LiveSessionRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // Modal + form
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Lookup options
  const [cityOpts, setCityOpts] = useState<Option[]>([]);
  const [centerOpts, setCenterOpts] = useState<Option[]>([]);
  const [courseOpts, setCourseOpts] = useState<Option[]>([]); // ✅ CHANGED: new course dropdown
  const [batchOpts, setBatchOpts] = useState<Option[]>([]);

  // ✅ CHANGED: keep a local cache of ALL batches so we can filter client-side
  const allBatchesRef = useRef<BatchRow[] | null>(null);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

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

  // ---------- Table data ----------
  const fetchData = async (nextPage = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/live_sessions?page=${nextPage}&pageSize=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      const ctype = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
      }
      if (!ctype.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Unexpected response (not JSON): ${text.slice(0, 120)}`);
      }
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load sessions");
      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || nextPage);
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || "Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Lookups ----------
  // Cities
  const fetchCities = async () => {
    const res = await fetch(`/api/admin/city`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    setCityOpts(
      list
        .map((c: any) => ({ value: Number(c.id), label: String(c.city) }))
        .sort((a: Option, b: Option) => a.label.localeCompare(b.label))
    );
  };

  // Centers for a set of cities
  const fetchCentersByCities = async (cityIds: number[]) => {
    if (!cityIds?.length) {
      setCenterOpts([]);
      return;
    }
    setLoadingCenters(true);
    try {
      const results: any[] = [];
      for (const id of cityIds) {
        const res = await fetch(`/api/admin/centers?city_id=${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (json?.success && Array.isArray(json?.data)) results.push(...json.data);
      }
      const map = new Map<number, any>();
      for (const c of results) map.set(Number(c.id), c);
      const merged = Array.from(map.values());
      setCenterOpts(
        merged
          .map((c: any) => ({ value: Number(c.id), label: String(c.center) }))
          .sort((a: Option, b: Option) => a.label.localeCompare(b.label))
      );
    } finally {
      setLoadingCenters(false);
    }
  };

  // ✅ CHANGED: One-time fetch of ALL batches; we’ll filter client-side for courses + batches
  const ensureAllBatches = async (): Promise<BatchRow[]> => {
    if (allBatchesRef.current) return allBatchesRef.current;
    const res = await fetch(`/api/admin/batches?page=1&pageSize=10000`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    const rows: BatchRow[] = Array.isArray(json?.data) ? json.data : [];
    allBatchesRef.current = rows;
    return rows;
  };

  // ✅ CHANGED: Build course options based on the chosen city_ids + center_ids using batches
  const buildCourseOptions = async (cityIds: number[], centerIds: number[]) => {
    setLoadingCourses(true);
    try {
      const all = await ensureAllBatches();
      // Filter by cities and centers
      const filtered = all.filter((b) => {
        const cityOk = !cityIds.length || (b.city_id != null && cityIds.includes(b.city_id));
        const centerOk = !centerIds.length || (b.center_id != null && centerIds.includes(b.center_id));
        return cityOk && centerOk;
      });

      // Unique courses from filtered batches
      const byCourse = new Map<number, string>();
      for (const b of filtered) {
        if (b.course_id != null && b.course_name) {
          byCourse.set(b.course_id, b.course_name);
        }
      }
      const opts = Array.from(byCourse.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setCourseOpts(opts);
    } finally {
      setLoadingCourses(false);
    }
  };

  // ✅ CHANGED: Build batch options based on chosen city_ids + center_ids + course_ids
  const buildBatchOptions = async (cityIds: number[], centerIds: number[], courseIds: number[]) => {
    setLoadingBatches(true);
    try {
      const all = await ensureAllBatches();
      const filtered = all.filter((b) => {
        const cityOk = !cityIds.length || (b.city_id != null && cityIds.includes(b.city_id));
        const centerOk = !centerIds.length || (b.center_id != null && centerIds.includes(b.center_id));
        const courseOk = !courseIds.length || (b.course_id != null && courseIds.includes(b.course_id));
        return cityOk && centerOk && courseOk;
      });

      const opts = filtered
        .map((b) => ({ value: b.id, label: b.batch_code }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setBatchOpts(opts);
    } finally {
      setLoadingBatches(false);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    fetchData(1);
    fetchCities().catch(() => {});
    // We lazily fetch batches the first time we need them via ensureAllBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Table columns ----------
  const columns: ColumnsType<LiveSessionRow> = useMemo(
    () => [
      { title: "Name", dataIndex: "name", key: "name", width: 220, ellipsis: true, render: (v) => v || "-", ...getColumnSearchProps("name") },
      { title: "Description", dataIndex: "description", key: "description", ellipsis: true, render: (v) => v || "-", ...getColumnSearchProps("description") },
      {
        title: "Batch Code(s)",
        dataIndex: "batch_codes",
        key: "batch_codes",
        width: 220,
        render: (arr) => (arr && arr.length ? arr.join(", ") : "-"),
        ...getColumnSearchProps("batch_codes"),
        onFilter: (value: any, record: any) => {
          const codes = record.batch_codes ? record.batch_codes.join(", ") : "";
          return codes.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        title: "City",
        dataIndex: "city_names",
        key: "city_names",
        width: 200,
        render: (arr) => (arr && arr.length ? arr.join(", ") : "-"),
        ...getColumnSearchProps("city_names"),
        onFilter: (value: any, record: any) => {
          const cities = record.city_names ? record.city_names.join(", ") : "";
          return cities.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        title: "Centers",
        dataIndex: "center_names",
        key: "center_names",
        width: 240,
        render: (arr) => (arr && arr.length ? arr.join(", ") : "-"),
        ...getColumnSearchProps("center_names"),
        onFilter: (value: any, record: any) => {
          const centers = record.center_names ? record.center_names.join(", ") : "";
          return centers.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        title: "Session link",
        dataIndex: "session_link",
        key: "session_link",
        width: 220,
        render: (url: string) => (url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : "-"),
        ...getColumnSearchProps("session_link"),
      },
      {
        title: "Start date & time",
        dataIndex: "start_date_time",
        key: "start_date_time",
        width: 180,
        render: (iso) => (iso ? dayjs(iso).tz(IST).format(DATE_FMT) : "-"),
        sorter: (a, b) => new Date(a.start_date_time || 0).getTime() - new Date(b.start_date_time || 0).getTime(),
      },
      {
        title: "End date & time",
        dataIndex: "end_date_time",
        key: "end_date_time",
        width: 180,
        render: (iso) => (iso ? dayjs(iso).tz(IST).format(DATE_FMT) : "-"),
        sorter: (a, b) => new Date(a.end_date_time || 0).getTime() - new Date(b.end_date_time || 0).getTime(),
      },
    ],
    [getColumnSearchProps]
  );

  const onChange = (pagination: TablePaginationConfig) => {
    const nextPage = pagination.current || 1;
    if (nextPage !== page) fetchData(nextPage);
  };

  // ---------- Modal handlers ----------
  const openModal = () => {
    form.resetFields();
    setCenterOpts([]);
    setCourseOpts([]); // ✅ CHANGED
    setBatchOpts([]);  // ✅ CHANGED
    setOpen(true);
  };

  // ✅ CHANGED: when cities change → load centers; clear centers/courses/batches
  const onCitiesChange = async (cityIds: number[]) => {
    await fetchCentersByCities(cityIds);
    form.setFieldsValue({ center_id: [], course_id: [], batch_id: [] });
    setCourseOpts([]);
    setBatchOpts([]);
  };

  // ✅ CHANGED: when centers change → compute courses from batches; clear course/batch
  const onCentersChange = async (centerIds: number[]) => {
    const cityIds: number[] = form.getFieldValue("city_id") || [];
    await buildCourseOptions(cityIds, centerIds);
    form.setFieldsValue({ course_id: [], batch_id: [] });
    setBatchOpts([]);
  };

  // ✅ CHANGED: when course changes → compute batches from (city, center, course)
  const onCoursesChange = async (courseIds: number[]) => {
    const cityIds: number[] = form.getFieldValue("city_id") || [];
    const centerIds: number[] = form.getFieldValue("center_id") || [];
    await buildBatchOptions(cityIds, centerIds, courseIds);
    form.setFieldsValue({ batch_id: [] });
  };

  const submitNewSession = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name?.trim() || null,
        description: values.description?.trim() || null,
        session_link: values.session_link.trim(),
        start_date_time: values.datetime?.[0]
          ? (values.datetime[0] as Dayjs).toDate().toISOString()
          : null,
        end_date_time: values.datetime?.[1]
          ? (values.datetime[1] as Dayjs).toDate().toISOString()
          : null,

        // ✅ CHANGED: now we also send course_id (array) alongside others, ready for future use
        batch_id: values.batch_id ?? [],
        city_id: values.city_id ?? [],
        center_id: values.center_id ?? [],
        course_id: values.course_id ?? [],
      };

      const res = await fetch("/api/admin/live_sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ctype = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
      }
      if (!ctype.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Unexpected response (not JSON): ${text.slice(0, 120)}`);
      }

      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Failed to create live session");

      message.success("Live session created");
      setOpen(false);
      await fetchData(page); // refresh current page
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Failed to create live session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Upcoming Live Sessions
        </Title>
        <Button type="primary" onClick={openModal}>
          Add live session
        </Button>
      </Space>

      <Table<LiveSessionRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        onChange={onChange}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false }}
        bordered
        size="middle"
      />

      <Modal
        title="Add live session"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submitNewSession}
        okButtonProps={{ loading: submitting }}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          // ✅ CHANGED: added course_id to initial values
          initialValues={{ batch_id: [], city_id: [], center_id: [], course_id: [] }}
        >
          <Form.Item label="Name" name="name">
            <Input placeholder="Optional session name" maxLength={120} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Optional description" rows={3} />
          </Form.Item>

          {/* ✅ CHANGED: City first */}
          <Form.Item
            label="City(ies)"
            name="city_id"
            tooltip="Select city names; centers list will filter based on these"
            rules={[{ required: true, message: "Please select at least one city" }]}
          >
            <Select
              mode="multiple"
              options={cityOpts}
              placeholder="Select cities"
              showSearch
              optionFilterProp="label"
              onChange={onCitiesChange}
              // ✅ CHANGED: make dropdown render inside modal to avoid z-index issues
              getPopupContainer={(trigger) => trigger.parentElement!}
            />
          </Form.Item>

          {/* ✅ CHANGED: Centers depend on Cities */}
          <Form.Item
            label="Center(s)"
            name="center_id"
            tooltip="Select centers (filtered by chosen cities)"
            rules={[{ required: true, message: "Please select at least one center" }]}
          >
            <Select
              mode="multiple"
              options={centerOpts}
              placeholder={loadingCenters ? "Loading centers..." : "Select centers"}
              showSearch
              optionFilterProp="label"
              onChange={onCentersChange}
              loading={loadingCenters}
              getPopupContainer={(trigger) => trigger.parentElement!}
            />
          </Form.Item>

          {/* ✅ CHANGED: Course depends on City + Center (derived from batches) */}
          <Form.Item
            label="Course(s)"
            name="course_id"
            tooltip="Courses derived from batches matching the selected cities and centers"
            rules={[{ required: true, message: "Please select at least one course" }]}
          >
            <Select
              mode="multiple"
              options={courseOpts}
              placeholder={loadingCourses ? "Loading courses..." : "Select courses"}
              showSearch
              optionFilterProp="label"
              onChange={onCoursesChange}
              loading={loadingCourses}
              getPopupContainer={(trigger) => trigger.parentElement!}
            />
          </Form.Item>

          {/* ✅ CHANGED: Batches depend on City + Center + Course */}
          <Form.Item
            label="Batch Code(s)"
            name="batch_id"
            tooltip="Batch codes filtered by the selected cities, centers and courses"
            rules={[{ required: true, message: "Please select at least one batch" }]}
          >
            <Select
              mode="multiple"
              options={batchOpts}
              placeholder={loadingBatches ? "Loading batches..." : "Select batches"}
              showSearch
              optionFilterProp="label"
              loading={loadingBatches}
              getPopupContainer={(trigger) => trigger.parentElement!}
            />
          </Form.Item>

          <Form.Item
            label="Session link"
            name="session_link"
            rules={[{ required: true, message: "Session link is required" }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            label="Start & End date/time"
            name="datetime"
            rules={[
              { required: true, message: "Start and End date/time are required" },
              {
                validator: (_, val: Dayjs[]) => {
                  if (!val || val.length !== 2) return Promise.reject("Please choose start and end");
                  const [s, e] = val;
                  if (!s || !e) return Promise.reject("Please choose start and end");
                  if (s.isAfter(e)) return Promise.reject("Start cannot be after End");
                  return Promise.resolve();
                },
              },
            ]}
          >
            <RangePicker showTime style={{ width: "100%" }} format={DATE_FMT} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
