// src/app/[locale]/admin/nav_contents/buttons/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Switch, Typography, message, Card } from "antd";
import { useRouter, useParams } from "next/navigation";

const { Title } = Typography;

type City   = { id: number; city: string };
type Center = { id: number; center: string; city_id: number };
type Course = { id: number; coursename: string };
type Batch  = { id: number; batch_code: string };
type StorageType = "URL" | "PATH";

export default function ButtonsPage() {
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

  // API helpers with improved error handling
  const loadCities = async () => {
    try {
      console.log("📤 Loading cities...");
      const res = await fetch(`/api/admin/nav_contents?resource=cities`);
      const data = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        console.error("❌ Failed to load cities:", { status: res.status, error: data.error });
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      console.log("✅ Cities loaded successfully:", data?.items?.length || 0);
      setCities(data?.items ?? []);
    } catch (e: any) {
      console.error("❌ Error loading cities:", e);
      message.error(e?.message || "Failed to load cities");
    }
  };

  const loadCenters = async (cityIds: number[]) => {
    try {
      console.log("📤 Loading centers for cityIds:", cityIds);
      const res = await fetch(`/api/admin/nav_contents?resource=centers&cityIds=${cityIds.join(",")}`);
      const data = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        console.error("❌ Failed to load centers:", { status: res.status, error: data.error });
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      console.log("✅ Centers loaded successfully:", data?.items?.length || 0);
      setCenters(data?.items ?? []);
    } catch (e: any) {
      console.error("❌ Error loading centers:", e);
      message.error(e?.message || "Failed to load centers");
    }
  };

  const loadCourses = async (cityIds: number[], centerIds: number[]) => {
    try {
      const qs = new URLSearchParams();
      if (cityIds.length) qs.set("cityIds", cityIds.join(","));
      if (centerIds.length) qs.set("centerIds", centerIds.join(","));
      
      console.log("📤 Loading courses for:", { cityIds, centerIds });
      const res = await fetch(`/api/admin/nav_contents?resource=courses&${qs.toString()}`);
      const data = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        console.error("❌ Failed to load courses:", { status: res.status, error: data.error });
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      console.log("✅ Courses loaded successfully:", data?.items?.length || 0);
      setCourses(data?.items ?? []);
    } catch (e: any) {
      console.error("❌ Error loading courses:", e);
      message.error(e?.message || "Failed to load courses");
    }
  };

  const loadBatches = async (cityIds: number[], centerIds: number[], courseIds: number[]) => {
    try {
      const qs = new URLSearchParams();
      if (cityIds.length) qs.set("cityIds", cityIds.join(","));
      if (centerIds.length) qs.set("centerIds", centerIds.join(","));
      if (courseIds.length) qs.set("courseIds", courseIds.join(","));
      
      console.log("📤 Loading batches for:", { cityIds, centerIds, courseIds });
      const res = await fetch(`/api/admin/nav_contents?resource=batches&${qs.toString()}`);
      const data = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        console.error("❌ Failed to load batches:", { status: res.status, error: data.error });
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      console.log("✅ Batches loaded successfully:", data?.items?.length || 0);
      setBatches(data?.items ?? []);
    } catch (e: any) {
      console.error("❌ Error loading batches:", e);
      message.error(e?.message || "Failed to load batches");
    }
  };

  useEffect(() => {
    loadCities();
    // defaults
    form.setFieldsValue({
      isactive: true,
      storage: "URL",
      city_id: [],
      center_id: [],
      course_id: [],
      batch_id: [],
    });
  }, []);

  // async validator for id_card_no with improved error handling
  const validateIdCard = async (_: any, value: string) => {
    if (!value) return Promise.resolve();
    try {
      console.log("📤 Validating ID card:", value);
      const res = await fetch(
        `/api/admin/nav_contents?resource=validateId&id_card_no=${encodeURIComponent(value)}`
      );
      const data = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        console.error("❌ ID card validation failed:", { status: res.status, error: data.error });
        return Promise.reject(new Error(data.error || "Validation service unavailable"));
      }

      if (!data?.exists) {
        console.log("❌ User not found for ID card:", value);
        return Promise.reject(new Error("No user exists with this ID card number"));
      }

      console.log("✅ ID card validation successful:", value);
      return Promise.resolve();
    } catch (e: any) {
      console.error("❌ ID card validation error:", e);
      return Promise.reject(new Error(e?.message || "Validation failed, try again"));
    }
  };

  // cascading change handlers
  const handleCityChange = async (ids: number[]) => {
    setSelectedCityIds(ids);
    form.setFieldValue("city_id", ids);
    // reset deeper
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
    // reset deeper
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

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        type: "buttons", // 👈 important: tell the API this is a "buttons" entry
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
        created_by: 101, // set as needed
        // optional: icon_name, test_type_id, is_navigation
      };

      console.log("📤 Sending button creation request...", payload);

      const res = await fetch("/api/admin/nav_contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({} as any));

      console.log("📥 Response received:", { status: res.status, data });

      if (!res.ok) {
        console.log("❌ Server failed to create button", { status: res.status, error: data.error });
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      if (!data.success) {
        console.log("❌ API returned failure", data);
        throw new Error(data.error || "Failed to create button");
      }

      console.log("✅ Button created successfully", data);
      message.success("Button saved successfully");
      form.resetFields();
      setStorageSel("URL");
      setSelectedCityIds([]); setSelectedCenterIds([]); setSelectedCourseIds([]);
      setCenters([]); setCourses([]); setBatches([]);
    } catch (e: any) {
      console.error("❌ Error during button creation", e);
      message.error(e?.message || "Save failed. Please try again.");
    } finally {
      setLoading(false);
      console.log("ℹ️ Button creation process finished");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>Buttons</Title>
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
            <Input placeholder="e.g. Important Links" />
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
              <Input placeholder="https://example.com" />
            </Form.Item>
          )}

          {storageSel === "PATH" && (
            <Form.Item
              label="Path"
              name="path"
              rules={[{ required: true, message: "Please enter a path" }]}
            >
              <Input placeholder="/some/path" />
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
        </Form>
      </Card>
    </div>
  );
}
