"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";

const { Title } = Typography;

type LocationMappingRow = {
  id: number;
  category_id: number;
  category_name?: string;
  course_id: number;
  course_name?: string;
  city_id: number;
  city_name?: string;
  center_id: number;
  center_name?: string;
  variant_id: number;
  variant_name?: string;
  created_at?: string;
  updated_at?: string;
};

type LookupOption = {
  id: number;
  label: string;
  variant_id?: number;
};

export default function LocationMappingsPage() {
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<LocationMappingRow[]>([]);

  // Lookups
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [allCourses, setAllCourses] = useState<LookupOption[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<LookupOption[]>([]);
  const [cities, setCities] = useState<LookupOption[]>([]);
  const [allCenters, setAllCenters] = useState<any[]>([]); // Keep city_id for filtering
  const [filteredCenters, setFilteredCenters] = useState<LookupOption[]>([]);
  const [variants, setVariants] = useState<LookupOption[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LocationMappingRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

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

  // Fetch mappings
  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location_mappings", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }
      setMappings(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      message.error(e?.message || "Failed to fetch mappings");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lookups
  const fetchLookups = useCallback(async () => {
    try {
      // Fetch categories
      const categoryRes = await fetch("/api/admin/course_categories");
      const categoryJson = await categoryRes.json().catch(() => ({}));
      if (categoryRes.ok && categoryJson?.success) {
        setCategories((categoryJson.data || []).map((c: any) => ({ id: c.id, label: c.category })));
      }

      // Fetch all courses
      const courseRes = await fetch("/api/admin/courses");
      const courseJson = await courseRes.json().catch(() => ({}));
      if (courseRes.ok && courseJson?.success) {
        const allCoursesList = (courseJson.data || []).map((c: any) => ({ 
          id: c.id, 
          label: c.coursename,
          category_id: c.course_category,
          variant_id: c.variant_id
        }));
        setAllCourses(allCoursesList);
        setFilteredCourses([]);
      }

      // Fetch cities
      const cityRes = await fetch("/api/admin/city");
      const cityJson = await cityRes.json().catch(() => ({}));
      if (cityRes.ok && cityJson?.success) {
        setCities((cityJson.data || []).map((c: any) => ({ id: c.id, label: c.city })));
      }

      // Fetch all centers
      const centerRes = await fetch("/api/admin/centers");
      const centerJson = await centerRes.json().catch(() => ({}));
      if (centerRes.ok && centerJson?.success) {
        const allCentersList = (centerJson.data || []).map((c: any) => ({ 
          id: c.id, 
          label: c.center, 
          city_id: c.city_id 
        }));
        setAllCenters(allCentersList);
        setFilteredCenters([]);
      }

      // Fetch variants
      const variantRes = await fetch("/api/admin/variants");
      const variantJson = await variantRes.json().catch(() => ({}));
      if (variantRes.ok && variantJson?.success) {
        setVariants((variantJson.data || []).map((v: any) => ({ id: v.id, label: v.variant })));
      }
    } catch (e) {
      console.error("Failed to fetch lookups:", e);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
    fetchLookups();
  }, [fetchMappings, fetchLookups]);

  // Handle category change - filter courses by selected category
  const onCategoryChange = (categoryId: number) => {
    const filtered = allCourses.filter((c: any) => c.category_id === categoryId);
    setFilteredCourses(filtered);
    form.setFieldsValue({ 
      course_id: undefined,
      variant_id: undefined,
      city_id: undefined,
      center_id: undefined 
    });
  };

  // Handle course change - set variant automatically if course has one
  const onCourseChange = (courseId: number) => {
    const course = allCourses.find((c: any) => c.id === courseId);
    if (course?.variant_id) {
      form.setFieldsValue({ variant_id: course.variant_id });
    }
    form.setFieldsValue({ city_id: undefined, center_id: undefined });
  };

  // Handle city change - filter centers by selected city
  const onCityChange = (cityId: number) => {
    const filtered = allCenters.filter((c: any) => c.city_id === cityId);
    setFilteredCenters(filtered);
    form.setFieldsValue({ center_id: undefined });
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setFilteredCourses([]);
    setFilteredCenters([]);
    setModalOpen(true);
  };

  const openEdit = (rec: LocationMappingRow) => {
    setEditing(rec);
    
    // Filter courses by category
    const coursesForCategory = allCourses.filter((c: any) => c.category_id === rec.category_id);
    setFilteredCourses(coursesForCategory);
    
    // Filter centers by city
    const centersForCity = allCenters.filter((c: any) => c.city_id === rec.city_id);
    setFilteredCenters(centersForCity);
    
    form.setFieldsValue({
      category_id: rec.category_id,
      course_id: rec.course_id,
      city_id: rec.city_id,
      center_id: rec.center_id,
      variant_id: rec.variant_id,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      
      const payload = {
        category_id: vals.category_id,
        course_id: vals.course_id,
        city_id: vals.city_id,
        center_id: vals.center_id,
        variant_id: vals.variant_id,
      };

      if (editing) {
        // Update
        const res = await fetch("/api/admin/location_mappings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success !== true) {
          throw new Error(json?.error || `Update failed (${res.status})`);
        }
        message.success("Mapping updated");
      } else {
        // Create
        const res = await fetch("/api/admin/location_mappings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success !== true) {
          throw new Error(json?.error || `Create failed (${res.status})`);
        }
        message.success("Mapping created");
      }

      setModalOpen(false);
      fetchMappings();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save mapping");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/location_mappings?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      message.success("Mapping deleted");
      fetchMappings();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
    { 
      title: "Category", 
      dataIndex: "category_name", 
      key: "category_name", 
      render: (v: any) => v ? <Tag color="purple">{v}</Tag> : "-",
      ...getColumnSearchProps("category_name"),
    },
    { 
      title: "Course", 
      dataIndex: "course_name", 
      key: "course_name", 
      render: (v: any) => v ?? "-",
      ...getColumnSearchProps("course_name"),
    },
    { 
      title: "City", 
      dataIndex: "city_name", 
      key: "city_name", 
      render: (v: any) => v ?? "-",
      ...getColumnSearchProps("city_name"),
    },
    { 
      title: "Center", 
      dataIndex: "center_name", 
      key: "center_name", 
      render: (v: any) => v ?? "-",
      ...getColumnSearchProps("center_name"),
    },
    { 
      title: "Variant", 
      dataIndex: "variant_name", 
      key: "variant_name", 
      render: (v: any) => v ? <Tag color="blue">{v}</Tag> : "-",
      ...getColumnSearchProps("variant_name"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: any, rec: LocationMappingRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm 
            title="Delete mapping?" 
            onConfirm={() => doDelete(rec.id)} 
            okText="Delete" 
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Location Mappings
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Mapping
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={mappings}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editing ? "Edit Location Mapping" : "Add Location Mapping"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category_id"
            label="Category"
            rules={[{ required: true, message: "Select category" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select category"
              onChange={onCategoryChange}
            >
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="course_id"
            label="Course"
            rules={[{ required: true, message: "Select course" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select course"
              onChange={onCourseChange}
              disabled={!form.getFieldValue("category_id")}
            >
              {filteredCourses.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="city_id"
            label="City"
            rules={[{ required: true, message: "Select city" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select city"
              onChange={onCityChange}
            >
              {cities.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="center_id"
            label="Center"
            rules={[{ required: true, message: "Select center" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select center"
              disabled={!form.getFieldValue("city_id")}
            >
              {filteredCenters.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="variant_id"
            label="Variant"
            rules={[{ required: true, message: "Select variant" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select variant"
            >
              {variants.map((v) => (
                <Select.Option key={v.id} value={v.id}>
                  {v.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

