"use client";

import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select, Space, Switch, Typography, message, Card } from "antd";
import { useRouter, useParams } from "next/navigation";

const { Title } = Typography;

type City   = { id: number; city: string };
type Center = { id: number; center: string; city_id: number };
type Course = { id: number; coursename: string };
type Batch  = { id: number; batch_code: string };
type TestType = { id: number; test_name: string };
type StorageType = "URL" | "PATH";

export default function TestsPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const [loading, setLoading] = useState(false);

  // local UI state
  const [storageSel, setStorageSel] = useState<StorageType>("URL");
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState<number[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  // dropdown data
  const [cities, setCities] = useState<City[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);

  // ---------- API helpers ----------
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
      setCenters(data?.items ?? []);
    } catch {
      message.error("Failed to load centers");
    }
  };

  const loadCourses = async (cityIds: number[], centerIds: number[]) => {
    try {
      const qs = new URLSearchParams();
      if (cityIds.length) qs.set("cityIds", cityIds.join(","));
      if (centerIds.length) qs.set("centerIds", centerIds.join(","));
      const res = await fetch(`/api/admin/nav_contents?resource=courses&${qs.toString()}`);
      const data = await res.json();
      setCourses(data?.items ?? []);
    } catch {
      message.error("Failed to load courses");
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
      setBatches(data?.items ?? []);
    } catch {
      message.error("Failed to load batches");
    }
  };

  const loadTestTypes = async () => {
    try {
      const res = await fetch(`/api/admin/nav_contents?resource=test_types`);
      const data = await res.json();
      setTestTypes(data?.items ?? []);
    } catch {
      message.error("Failed to load test types");
    }
  };

  // ---------- mount ----------
  useEffect(() => {
    loadCities();
    loadTestTypes();
    form.setFieldsValue({
      isactive: true,
      storage: "URL",
      city_id: [],
      center_id: [],
      course_id: [],
      batch_id: [],
    });
  }, []);

  // ---------- id_card_no async validator ----------
  const validateIdCard = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    try {
      const res = await fetch(`/api/admin/nav_contents?resource=validateId&id_card_no=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!data?.exists) return Promise.reject(new Error("No user exists with this ID card number"));
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Validation failed, try again"));
    }
  };

  // ---------- cascading handlers ----------
  const handleCityChange = async (ids: number[]) => {
    setSelectedCityIds(ids);
    form.setFieldValue("city_id", ids);
    setSelectedCenterIds([]); setSelectedCourseIds([]);
    form.setFieldsValue({ center_id: [], course_id: [], batch_id: [] });
    setCenters([]); setCourses([]); setBatches([]);
    if (ids.length) {
      await loadCenters(ids);
      await loadCourses(ids, []);
      await loadBatches(ids, [], []);
    }
  };

  const handleCenterChange = async (ids: number[]) => {
    setSelectedCenterIds(ids);
    form.setFieldValue("center_id", ids);
    setSelectedCourseIds([]);
    form.setFieldsValue({ course_id: [], batch_id: [] });
    setCourses([]); setBatches([]);
    await loadCourses(selectedCityIds, ids);
    await loadBatches(selectedCityIds, ids, []);
  };

  const handleCourseChange = async (ids: number[]) => {
    setSelectedCourseIds(ids);
    form.setFieldValue("course_id", ids);
    form.setFieldsValue({ batch_id: [] });
    setBatches([]);
    await loadBatches(selectedCityIds, selectedCenterIds, ids);
  };

  // ---------- submit ----------
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        type: "tests", // 👈 save into nav_contents as tests
        label: values.label,
        storage: values.storage as StorageType,
        url: values.storage === "URL" ? values.url ?? null : null,
        path: values.storage === "PATH" ? values.path ?? null : null,
        id_card_nos: values.id_card_no ? [values.id_card_no] : [],
        isactive: values.isactive ?? true,
        city_id: values.city_id ?? [],
        center_id: values.center_id ?? [],
        course_id: values.course_id ?? [],
        batch_id: values.batch_id ?? [],
        test_type_id: values.test_type_id ?? null, // 👈 from dropdown
        created_by: 101,
      };

      const res = await fetch("/api/admin/nav_contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create");

      message.success("Test link saved");
      form.resetFields();
      setStorageSel("URL");
      setSelectedCityIds([]); setSelectedCenterIds([]); setSelectedCourseIds([]);
      setCenters([]); setCourses([]); setBatches([]);
    } catch (e: any) {
      message.error(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>Tests</Title>
        <Space>
          <Button onClick={() => router.push(`/${locale}/admin/nav_contents`)}>Back</Button>
          <Button type="primary" onClick={onSubmit} loading={loading}>Save</Button>
        </Space>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Label"
            name="label"
            rules={[{ required: true, message: "Please enter a label" }]}
          >
            <Input placeholder="e.g. Mock Tests / Sectional Tests" />
          </Form.Item>

          <Form.Item
            label="Storage"
            name="storage"
            rules={[{ required: true, message: "Please select storage type" }]}
          >
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
              <Input placeholder="https://vendor.com/tests" />
            </Form.Item>
          )}

          {storageSel === "PATH" && (
            <Form.Item
              label="Path"
              name="path"
              rules={[{ required: true, message: "Please enter a path" }]}
            >
              <Input placeholder="/internal/path/tests" />
            </Form.Item>
          )}

          <Form.Item
            label="ID Card No"
            name="id_card_no"
            validateFirst
            rules={[
              { required: true, message: "Please enter an ID Card No" },
              { validator: validateIdCard },
            ]}
            validateTrigger="onBlur"
            help={form.getFieldError("id_card_no").length ? "No user exists" : undefined}
            validateStatus={form.getFieldError("id_card_no").length ? "error" : undefined}
          >
            <Input placeholder="e.g. T123456" />
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
              onChange={handleCityChange}
              options={cities.map((c) => ({ label: c.city, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label="Centers" name="center_id">
            <Select
              mode="multiple"
              placeholder={selectedCityIds.length ? "Select center(s)" : "Select city first"}
              disabled={!selectedCityIds.length}
              value={selectedCenterIds}
              onChange={handleCenterChange}
              options={centers.map((c) => ({ label: c.center, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label="Courses" name="course_id">
            <Select
              mode="multiple"
              placeholder={
                selectedCityIds.length || selectedCenterIds.length
                  ? "Select course(s)"
                  : "Select city/center first"
              }
              disabled={!(selectedCityIds.length || selectedCenterIds.length)}
              value={selectedCourseIds}
              onChange={handleCourseChange}
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

          <Form.Item
            label="Test Type"
            name="test_type_id"
            rules={[{ required: true, message: "Please select a test type" }]}
          >
            <Select
              placeholder="Select test type"
              options={testTypes.map((t) => ({ label: t.test_name, value: t.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
