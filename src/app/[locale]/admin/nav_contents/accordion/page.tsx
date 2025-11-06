"use client";

import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select, Space, Switch, Typography, message, Card, Divider } from "antd";
import { useParams, useRouter } from "next/navigation";

const { Title, Text } = Typography;

type City = { id: number; city: string };
type Center = { id: number; center: string; city_id: number };
type Course = { id: number; coursename: string };
type Batch = { id: number; batch_code: string };
type StorageType = "URL" | "PATH";

type SubRow = {
  key: string;
  text?: string;
  storage?: StorageType; // kept, but we actually use storageSel for UI
  url?: string | null;
  path?: string | null;
  id_card_nos: string[];     // ✅ plural, array everywhere
  isactive?: boolean;
  city_id: number[];
  center_id: number[];
  course_id: number[];
  batch_id: number[];
  // local UI state
  storageSel: StorageType;
  selCities: number[];
  selCenters: number[];
  selCourses: number[];
  // dropdown data per sub
  centers: Center[];
  courses: Course[];
  batches: Batch[];
};

export default function AccordionPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const [loading, setLoading] = useState(false);

  // main dropdown data (cities shared)
  const [cities, setCities] = useState<City[]>([]);

  // main selections & dropdown data
  const [storageSel, setStorageSel] = useState<StorageType>("URL");
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState<number[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // sub-accordions
  const [subRows, setSubRows] = useState<SubRow[]>([]);

  // --- API helpers (shared) ---
  const loadCities = async () => {
    try {
      const res = await fetch(`/api/admin/nav_contents?resource=cities`);
      const data = await res.json();
      setCities(data?.items ?? []);
    } catch {
      message.error("Failed to load cities");
    }
  };

  const loadCenters = async (cityIds: number[]) => {
    try {
      const res = await fetch(`/api/admin/nav_contents?resource=centers&cityIds=${cityIds.join(",")}`);
      const data = await res.json();
      return data?.items ?? [];
    } catch {
      message.error("Failed to load centers");
      return [];
    }
  };

  const loadCourses = async (cityIds: number[], centerIds: number[]) => {
    try {
      const qs = new URLSearchParams();
      if (cityIds.length) qs.set("cityIds", cityIds.join(","));
      if (centerIds.length) qs.set("centerIds", centerIds.join(","));
      const res = await fetch(`/api/admin/nav_contents?resource=courses&${qs.toString()}`);
      const data = await res.json();
      return data?.items ?? [];
    } catch {
      message.error("Failed to load courses");
      return [];
    }
  };

  const loadBatches = async (cityIds: number[], centerIds: number[], courseIds: number[]) => {
    try {
      const qs = new URLSearchParams();
      if (cityIds.length) qs.set("cityIds", cityIds.join(","));
      if (centerIds.length) qs.set("centerIds", centerIds.join(","));
      if (courseIds.length) qs.set("courseIds", courseIds.join(","));
      const res = await fetch(`/api/admin/nav_contents?resource=batches&${qs.toString()}`);
      const data = await res.json();
      return data?.items ?? [];
    } catch {
      message.error("Failed to load batches");
      return [];
    }
  };

  // --- mount ---
  useEffect(() => {
    loadCities();
    form.setFieldsValue({
      isactive: true,
      storage: "URL",
      city_id: [],
      center_id: [],
      course_id: [],
      batch_id: [],
      id_card_nos: [], // ✅ main chips initial value
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- id_card_no async validator (single) ---
  const validateIdCard = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    try {
      const res = await fetch(
        `/api/admin/nav_contents?resource=validateId&id_card_no=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      if (!data?.exists) return Promise.reject(new Error("No user exists with this ID card number"));
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Validation failed, try again"));
    }
  };

  // validate an array of ids (chips)
  const validateIdCardsArray = async (_: any, value?: string[]) => {
    const ids = (value ?? []).filter(Boolean);
    if (!ids.length) return Promise.reject(new Error("Please add at least one ID Card No"));
    const results = await Promise.allSettled(ids.map((id) => validateIdCard(null, id)));
    const failed = results
      .map((r, i) => (r.status === "rejected" ? ids[i] : null))
      .filter(Boolean) as string[];
    if (failed.length) {
      return Promise.reject(new Error(`Invalid IDs: ${failed.join(", ")}`));
    }
    return Promise.resolve();
  };

  // ---------- MAIN cascading handlers ----------
  const onMainCities = async (ids: number[]) => {
    setSelectedCityIds(ids);
    form.setFieldValue("city_id", ids);
    setSelectedCenterIds([]);
    setSelectedCourseIds([]);
    form.setFieldsValue({ center_id: [], course_id: [], batch_id: [] });
    setCenters([]);
    setCourses([]);
    setBatches([]);
    if (ids.length) {
      const c = await loadCenters(ids);
      setCenters(c);
      const crs = await loadCourses(ids, []);
      setCourses(crs);
      const b = await loadBatches(ids, [], []);
      setBatches(b);
    }
  };

  const onMainCenters = async (ids: number[]) => {
    setSelectedCenterIds(ids);
    form.setFieldValue("center_id", ids);
    setSelectedCourseIds([]);
    form.setFieldsValue({ course_id: [], batch_id: [] });
    setCourses([]);
    setBatches([]);
    const crs = await loadCourses(selectedCityIds, ids);
    setCourses(crs);
    const b = await loadBatches(selectedCityIds, ids, []);
    setBatches(b);
  };

  const onMainCourses = async (ids: number[]) => {
    setSelectedCourseIds(ids);
    form.setFieldValue("course_id", ids);
    form.setFieldsValue({ batch_id: [] });
    setBatches([]);
    const b = await loadBatches(selectedCityIds, selectedCenterIds, ids);
    setBatches(b);
  };

  // ---------- SUB helpers ----------
  const addSubRow = () => {
    setSubRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        text: "",
        storage: "URL",
        url: "",
        path: null,
        id_card_nos: [],        // ✅ array initial value
        isactive: true,
        city_id: [],
        center_id: [],
        course_id: [],
        batch_id: [],
        storageSel: "URL",
        selCities: [],
        selCenters: [],
        selCourses: [],
        centers: [],
        courses: [],
        batches: [],
      },
    ]);
  };

  const removeSubRow = (key: string) => {
    setSubRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateSub = (key: string, patch: Partial<SubRow>) => {
    setSubRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  // per-sub cascading:
  const onSubCities = async (row: SubRow, ids: number[]) => {
    updateSub(row.key, {
      selCities: ids,
      city_id: ids,
      selCenters: [],
      selCourses: [],
      center_id: [],
      course_id: [],
      batch_id: [],
      centers: [],
      courses: [],
      batches: [],
    });
    if (ids.length) {
      const c = await loadCenters(ids);
      const crs = await loadCourses(ids, []);
      const b = await loadBatches(ids, [], []);
      updateSub(row.key, { centers: c, courses: crs, batches: b });
    }
  };

  const onSubCenters = async (row: SubRow, ids: number[]) => {
    updateSub(row.key, {
      selCenters: ids,
      center_id: ids,
      selCourses: [],
      course_id: [],
      batch_id: [],
      courses: [],
      batches: [],
    });
    const crs = await loadCourses(row.selCities, ids);
    const b = await loadBatches(row.selCities, ids, []);
    updateSub(row.key, { courses: crs, batches: b });
  };

  const onSubCourses = async (row: SubRow, ids: number[]) => {
    updateSub(row.key, {
      selCourses: ids,
      course_id: ids,
      batch_id: [],
      batches: [],
    });
    const b = await loadBatches(row.selCities, row.selCenters, ids);
    updateSub(row.key, { batches: b });
  };

  // --- submit ---
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      // validate sub-rows minimal required fields
      for (const r of subRows) {
        if (!r.text || !r.storageSel) {
          throw new Error("Please fill all Sub Accordion required fields.");
        }
        if (r.storageSel === "URL" && !r.url) {
          throw new Error("Each Sub Accordion with storage=URL needs a URL.");
        }
        if (r.storageSel === "PATH" && !r.path) {
          throw new Error("Each Sub Accordion with storage=PATH needs a Path.");
        }
      }

      setLoading(true);

      const payload = {
        // main
        type: "accordion" as const,
        label: values.label as string,
        storage: values.storage as StorageType,
        url: values.storage === "URL" ? (values.url ?? null) : null,
        path: values.storage === "PATH" ? (values.path ?? null) : null,
        id_card_nos: Array.isArray(values.id_card_nos) ? values.id_card_nos : [], // ✅ main chips
        isactive: values.isactive ?? true,
        city_id: (values.city_id ?? []) as number[],
        center_id: (values.center_id ?? []) as number[],
        course_id: (values.course_id ?? []) as number[],
        batch_id: (values.batch_id ?? []) as number[],
        created_by: 101,

        // sub rows
        sub_rows: subRows.map((r) => ({
          text: r.text || "",
          storage: r.storageSel,
          url: r.storageSel === "URL" ? (r.url ?? null) : null,
          path: r.storageSel === "PATH" ? (r.path ?? null) : null,
          id_card_nos: Array.isArray(r.id_card_nos) ? r.id_card_nos : [],
          isactive: r.isactive ?? true,
          city_id: r.city_id ?? [],
          center_id: r.center_id ?? [],
          course_id: r.course_id ?? [],
          batch_id: r.batch_id ?? [],
          created_by: 101,
        })),
      };

      const res = await fetch("/api/admin/nav_contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create");

      message.success("Accordion with sub accordions created");
      form.resetFields();
      setStorageSel("URL");
      setSelectedCityIds([]);
      setSelectedCenterIds([]);
      setSelectedCourseIds([]);
      setCenters([]);
      setCourses([]);
      setBatches([]);
      setSubRows([]);
      // router.push(`/${locale}/admin/nav_contents`);
    } catch (e: any) {
      message.error(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>Add Accordion</Title>
        <Space>
          <Button onClick={() => router.push(`/${locale}/admin/nav_contents`)}>Back</Button>
          <Button type="primary" onClick={onSubmit} loading={loading}>Save</Button>
        </Space>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Form.Item label="Label" name="label" rules={[{ required: true, message: "Please enter a label" }]}>
            <Input placeholder="e.g. Admissions FAQs / Policies" />
          </Form.Item>

          <Form.Item label="Storage" name="storage" rules={[{ required: true, message: "Please select storage type" }]}>
            <Select
              options={[{ label: "URL", value: "URL" }, { label: "PATH", value: "PATH" }]}
              onChange={(v: StorageType) => setStorageSel(v)}
            />
          </Form.Item>

          {storageSel === "URL" && (
            <Form.Item
              label="URL"
              name="url"
              rules={[
                { required: true, message: "Please enter a URL" },
                { type: "url" as const, message: "Please enter a valid URL (http/https)" },
              ]}
            >
              <Input placeholder="https://example.com/accordion" />
            </Form.Item>
          )}
          {storageSel === "PATH" && (
            <Form.Item label="Path" name="path" rules={[{ required: true, message: "Please enter a path" }]}>
              <Input placeholder="/internal/path/accordion" />
            </Form.Item>
          )}

          {/* ✅ Main chips for multiple IDs */}
          <Form.Item
            label="User ID Cards"
            name="id_card_nos"
            rules={[{ validator: validateIdCardsArray }]}
          >
            <Select
              mode="tags"
              placeholder="Type an ID and press Enter"
              tokenSeparators={[",", " "]}
              allowClear
            />
          </Form.Item>

          <Form.Item label="Active" name="isactive" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item label="Cities" name="city_id">
            <Select
              mode="multiple"
              placeholder="Select city/cities"
              optionFilterProp="label"
              value={selectedCityIds}
              onChange={onMainCities}
              options={cities.map((c) => ({ label: c.city, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label="Centers" name="center_id">
            <Select
              mode="multiple"
              placeholder={selectedCityIds.length ? "Select center(s)" : "Select city first"}
              disabled={!selectedCityIds.length}
              value={selectedCenterIds}
              onChange={onMainCenters}
              options={centers.map((c) => ({ label: c.center, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label="Courses" name="course_id">
            <Select
              mode="multiple"
              placeholder={
                selectedCityIds.length || selectedCenterIds.length ? "Select course(s)" : "Select city/center first"
              }
              disabled={!(selectedCityIds.length || selectedCenterIds.length)}
              value={selectedCourseIds}
              onChange={onMainCourses}
              options={courses.map((c) => ({ label: c.coursename, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label="Batches" name="batch_id">
            <Select
              mode="multiple"
              placeholder={
                selectedCityIds.length || selectedCenterIds.length || selectedCourseIds.length
                  ? "Select batch(es)"
                  : "Select city/center/course first"
              }
              disabled={!(selectedCityIds.length || selectedCenterIds.length || selectedCourseIds.length)}
              options={batches.map((b) => ({ label: b.batch_code, value: b.id }))}
            />
          </Form.Item>

          {/* Right-aligned "Add Sub Accordion" */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 8 }}>
            <Button onClick={addSubRow}>Add Sub Accordion</Button>
          </div>
        </Form>
      </Card>

      {subRows.length > 0 && (
        <>
          <Divider />
          <Title level={4}>Sub Accordions</Title>
        </>
      )}

      {subRows.map((row, idx) => (
        <Card key={row.key} style={{ marginTop: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Text strong>Sub Accordion #{idx + 1}</Text>
            <Button danger onClick={() => removeSubRow(row.key)}>Remove</Button>
          </Space>

          <div style={{ height: 12 }} />

          <Form layout="vertical">
            <Form.Item label="Name" required>
              <Input
                placeholder="e.g. Eligibility / Refund policy"
                value={row.text}
                onChange={(e) => updateSub(row.key, { text: e.target.value })}
              />
            </Form.Item>

            <Form.Item label="Storage" required>
              <Select
                value={row.storageSel}
                options={[{ label: "URL", value: "URL" }, { label: "PATH", value: "PATH" }]}
                onChange={(v: StorageType) => updateSub(row.key, { storageSel: v })}
              />
            </Form.Item>

            {row.storageSel === "URL" && (
              <Form.Item label="URL" required>
                <Input
                  placeholder="https://example.com/sub"
                  value={row.url ?? ""}
                  onChange={(e) => updateSub(row.key, { url: e.target.value, path: null })}
                />
              </Form.Item>
            )}
            {row.storageSel === "PATH" && (
              <Form.Item label="Path" required>
                <Input
                  placeholder="/internal/path/sub"
                  value={row.path ?? ""}
                  onChange={(e) => updateSub(row.key, { path: e.target.value, url: null })}
                />
              </Form.Item>
            )}

            {/* ✅ Sub-row chips for multiple IDs */}
            <Form.Item label="User ID Cards" required>
              <Select
                mode="tags"
                placeholder="Type ID(s) and press Enter"
                tokenSeparators={[",", " "]}
                value={row.id_card_nos}
                onChange={(ids: string[]) => updateSub(row.key, { id_card_nos: ids })}
                onBlur={async () => {
                  try {
                    await validateIdCardsArray(null, row.id_card_nos);
                    message.success("All IDs valid");
                  } catch (err: any) {
                    message.error(err?.message || "Invalid IDs");
                  }
                }}
                allowClear
              />
            </Form.Item>

            <Form.Item label="Active" valuePropName="checked" initialValue={true}>
              <Switch
                checked={row.isactive}
                onChange={(v) => updateSub(row.key, { isactive: v })}
              />
            </Form.Item>

            <Form.Item label="Cities">
              <Select
                mode="multiple"
                placeholder="Select city/cities"
                optionFilterProp="label"
                value={row.selCities}
                onChange={(ids: number[]) => onSubCities(row, ids)}
                options={cities.map((c) => ({ label: c.city, value: c.id }))}
              />
            </Form.Item>

            <Form.Item label="Centers">
              <Select
                mode="multiple"
                placeholder={row.selCities.length ? "Select center(s)" : "Select city first"}
                disabled={!row.selCities.length}
                value={row.selCenters}
                onChange={(ids: number[]) => onSubCenters(row, ids)}
                options={row.centers.map((c) => ({ label: c.center, value: c.id }))}
              />
            </Form.Item>

            <Form.Item label="Courses">
              <Select
                mode="multiple"
                placeholder={
                  row.selCities.length || row.selCenters.length
                    ? "Select course(s)"
                    : "Select city/center first"
                }
                disabled={!(row.selCities.length || row.selCenters.length)}
                value={row.selCourses}
                onChange={(ids: number[]) => onSubCourses(row, ids)}
                options={row.courses.map((c) => ({ label: c.coursename, value: c.id }))}
              />
            </Form.Item>

            <Form.Item label="Batches">
              <Select
                mode="multiple"
                placeholder={
                  row.selCities.length || row.selCenters.length || row.selCourses.length
                    ? "Select batch(es)"
                    : "Select city/center/course first"
                }
                disabled={!(row.selCities.length || row.selCenters.length || row.selCourses.length)}
                value={row.batch_id}
                onChange={(ids: number[]) => updateSub(row.key, { batch_id: ids })}
                options={row.batches.map((b) => ({ label: b.batch_code, value: b.id }))}
              />
            </Form.Item>
          </Form>
        </Card>
      ))}
    </div>
  );
}
