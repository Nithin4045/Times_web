"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Table,
  Spin,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  InputNumber,
  Space,
  Select,
  Switch,
  DatePicker,
  Divider,
  Popconfirm,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

type Vendor = {
  vendorName?: string;
  test_link?: string;
  status?: string | boolean;
  [k: string]: any;
};

type TestRowFromAPI = {
  id: number;
  test_link: any; // JSON array
  description?: string | null;
  name?: string | null;
  solution?: string | null;
  type?: string | null;
  test_ref?: string | null;
  course_id?: number[] | null;
  tests_area_level_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

type FlattenedRow = {
  key: string;
  id: number;
  test_ref?: string | null;
  testName?: string | null;
  testDescription?: string | null;
  vendorName?: string | null;
  vendorTestLink?: string | null;
  solution?: string | null;
  type?: string | null;
  course_id?: number[] | null;
  courseNames?: string;
  tests_area_level_id?: number | null;
  area?: string;
  level?: string;
  testTypes?: string;
  test_type_ids?: number[];
  start_date?: string | null;
  end_date?: string | null;
};

type LookupOption = { id: number; label: string };
type TestType = { id: number; test_name: string };

type Area = string;
type Level = string;

type AreaLevels = Record<Area, { level: Level; id: number }[]>;

type AddTestFormValues = {
  // Part 1: tests
  test_ref: string;
  name: string;
  description?: string;
  solution?: string;
  vendorName: string;
  test_link: string;
  status: boolean;

  // Part 2: mapping
  city_ids: number[];
  center_ids: number[];
  course_ids: number[];
  id_card_nos: string[]; // array of id_card_nos
  area: Area;
  level: Level;
  date_range?: [Dayjs, Dayjs];
};

export default function TestsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string | undefined;

  const [loading, setLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<FlattenedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Lookups for displaying course names and area/level
  const [coursesLookup, setCoursesLookup] = useState<Map<number, string>>(new Map());
  const [areaLevelsLookup, setAreaLevelsLookup] = useState<Map<number, { area: string; level: string; test_type_id: number[] }>>(new Map());
  const [testTypesLookup, setTestTypesLookup] = useState<Map<number, string>>(new Map());

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


  // NEW: Add Tests modal + form
  const [addVisible, setAddVisible] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addForm] = Form.useForm<AddTestFormValues>();

  // Edit/Delete/View modals
  const [editVisible, setEditVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<FlattenedRow | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm();

  const [coursesVisible, setCoursesVisible] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [editingCoursesTestId, setEditingCoursesTestId] = useState<number | null>(null);
  const [coursesSubmitting, setCoursesSubmitting] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesForm] = Form.useForm();

  // lookups for Add Tests
  const [cities, setCities] = useState<LookupOption[]>([]);
  const [centers, setCenters] = useState<LookupOption[]>([]);
  const [courses, setCourses] = useState<LookupOption[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaLevels, setAreaLevels] = useState<AreaLevels>({});
  const [users, setUsers] = useState<{ id_card_no: string; label: string }[]>([]);

  // const levelsForSelectedArea = useMemo(() => {
  //   const selectedArea = addForm.getFieldValue("area") as string | undefined;
  //   if (!selectedArea) return [];
  //   return areaLevels[selectedArea]?.map((x) => x.level) ?? [];
  // }, [addForm, areaLevels]);


  // right under: const [addForm] = Form.useForm<AddTestFormValues>();
  const selectedArea = Form.useWatch("area", addForm);

  const levelOptions = React.useMemo(
    () =>
      selectedArea
        ? (areaLevels[selectedArea] ?? []).map((x) => ({ label: x.level, value: x.level }))
        : [],
    [selectedArea, areaLevels]
  );


  // -- Load tests (vendors with status = true) --
  const fetchTests = React.useCallback(() => {
    setLoading(true);

    fetch(`/api/admin/tests`)
      .then((res) => res.json())
      .then((json) => {

        if (!json.success) {
          setError(json.error || "Failed to load tests");
          setRows([]);
          setLoading(false);
          return;
        }

        // Build lookups
        const courses = json.lookups?.courses || [];
        const areaLevels = json.lookups?.areaLevels || [];
        const testTypes = json.lookups?.testTypes || [];
        
        const coursesMap = new Map<number, string>(courses.map((c: any) => [c.id, c.coursename]));
        const areaLevelsMap = new Map<number, { area: string; level: string; test_type_id: number[] }>(
          areaLevels.map((al: any) => [al.id, { area: al.area, level: al.level, test_type_id: al.test_type_id || [] }])
        );
        const testTypesMap = new Map<number, string>(testTypes.map((tt: any) => [tt.id, tt.test_name]));
        
        setCoursesLookup(coursesMap);
        setAreaLevelsLookup(areaLevelsMap);
        setTestTypesLookup(testTypesMap);

        const apiRows: TestRowFromAPI[] = json.data ?? [];
        const flat: FlattenedRow[] = [];
        
        apiRows.forEach((t) => {
          // Handle test_link - could be array, string, or already parsed
          let vendors: Vendor[] = [];
          
          if (Array.isArray(t.test_link)) {
            vendors = t.test_link;
          } else if (typeof t.test_link === 'string' && t.test_link.trim().length > 0) {
            try {
              const parsed = JSON.parse(t.test_link);
              vendors = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.error(`Failed to parse test_link for test ${t.id}:`, e);
              vendors = [];
            }
          }
          
          const matching = vendors.filter((v) => {
            if (v == null) return false;
            const s = v.status;
            if (typeof s === "boolean") return s === true;
            if (typeof s === "string") return s.toLowerCase() === "true";
            return false;
          });

          if (matching.length === 0) {
            return;
          }

          // Get course names
          const courseNames = Array.isArray(t.course_id)
            ? t.course_id.map(id => coursesMap.get(id) || `Course ${id}`).join(", ")
            : "-";

          // Get area and level
          const areaLevel = t.tests_area_level_id ? areaLevelsMap.get(t.tests_area_level_id) : null;
          const area = areaLevel ? areaLevel.area : "-";
          const level = areaLevel ? areaLevel.level : "-";
          const test_type_ids = areaLevel?.test_type_id || [];
          const testTypesStr = test_type_ids
            .map(id => testTypesMap.get(id) || `Type ${id}`)
            .join(", ") || "-";

          matching.forEach((v, idx) => {
            flat.push({
              key: `${t.id}-${idx}`,
              id: t.id,
              test_ref: t.test_ref ?? null,
              testName: t.name ?? null,
              testDescription: t.description ?? null,
              vendorName: v.vendorName ?? null,
              vendorTestLink: v.test_link ?? null,
              solution: t.solution ?? null,
              type: t.type ?? null,
              course_id: t.course_id,
              courseNames,
              tests_area_level_id: t.tests_area_level_id,
              area,
              level,
              testTypes: testTypesStr,
              test_type_ids,
              start_date: t.start_date,
              end_date: t.end_date,
            });
          });
        });

        setRows(flat);
        setLoading(false);
      })
      .catch((e) => {
        console.error("[Admin Tests] Fetch error:", e);
        setError("Network error");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Edit/Delete/View Test handlers
  // -------------------------
  const openViewCourses = async (test: FlattenedRow) => {
    setSelectedCourses(test.course_id || []);
    setEditingCoursesTestId(test.id);
    coursesForm.setFieldsValue({
      course_id: test.course_id || []
    });
    setCoursesVisible(true);
    
    // Fetch all courses for the dropdown
    setCoursesLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const map = new Map<number, string>(coursesLookup);
        json.data.forEach((c: any) => {
          map.set(c.id, c.coursename);
        });
        setCoursesLookup(map);
      }
    } catch (e) {
      console.error("Failed to fetch courses for dropdown");
    } finally {
      setCoursesLoading(false);
    }
  };

  const submitCourses = async () => {
    if (!editingCoursesTestId) return;
    try {
      setCoursesSubmitting(true);
      const vals = await coursesForm.validateFields();
      
      const res = await fetch("/api/admin/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCoursesTestId,
          course_id: vals.course_id || [],
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Courses updated");
      setCoursesVisible(false);
      fetchTests();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update courses");
    } finally {
      setCoursesSubmitting(false);
    }
  };

  const openEditTest = (test: FlattenedRow) => {
    setEditingTest(test);
    editForm.setFieldsValue({
      id: test.id,
      test_ref: test.test_ref,
      name: test.testName,
      description: test.testDescription,
      solution: test.solution,
    });
    setEditVisible(true);
  };

  const submitEditTest = async () => {
    if (!editingTest) return;
    try {
      setEditSubmitting(true);
      const vals = await editForm.validateFields();
      
      // For now, just update basic fields (test_ref, name, description, solution)
      // Note: Editing test_link, course_id arrays would need more complex UI
      const res = await fetch("/api/admin/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTest.id,
          test_ref: vals.test_ref?.trim(),
          name: vals.name?.trim(),
          description: vals.description?.trim() || null,
          solution: vals.solution?.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Test updated");
      setEditVisible(false);
      fetchTests();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update test");
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteTest = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tests?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      message.success("Test deleted");
      fetchTests();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete test");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Test Types handlers (existing)
  // -------------------------
  const handleOpenTestTypes = () => {
    const prefix = locale ? `/${locale}` : "";
    router.push(`${prefix}/admin/test_types`);
  };

  // -------------------------
  // Test Area Level handlers (existing)
  // -------------------------
  const handleOpenTestAreaLevel = () => {
    const prefix = locale ? `/${locale}` : "";
    router.push(`${prefix}/admin/test_area_level`);
  };

  // -------------------------
  // New: Add Tests handlers
  // -------------------------
  const openAddTests = async () => {
    addForm.resetFields();
    setAddVisible(true);
    try {
      const res = await fetch("/api/admin/lookups");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load lookups");

      setCities(json.data?.cities ?? []);
      setCenters(json.data?.centers ?? []);
      setCourses(json.data?.courses ?? []);
      setAreas(json.data?.areas ?? []);
      setAreaLevels(json.data?.areaLevels ?? {});
      setUsers(json.data?.users ?? []);

      // sensible defaults
      addForm.setFieldsValue({
        status: true,
      });
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Could not load lookups");
    }
  };

  const onSubmitAddTests = async (values: AddTestFormValues) => {
    setAddSubmitting(true);
    try {
      const idCardNos = Array.isArray(values.id_card_nos) ? values.id_card_nos : [];

      if (!values.area) throw new Error("Please select an Area");
      if (!values.level) throw new Error("Please select a Level");
      if (!areaLevels[values.area] || areaLevels[values.area].length === 0)
        throw new Error(`No Levels found for Area "${values.area}"`);

      const tal = areaLevels[values.area].find((x) => x.level === values.level);
      if (!tal) throw new Error(`No mapping id found for ${values.area} → ${values.level}`);

      const payload = {
        test: {
          test_ref: values.test_ref,
          name: values.name,
          description: values.description ?? null,
          solution: values.solution ?? null,
          test_link: [
            {
              vendorName: values.vendorName,
              test_link: values.test_link,
              status: values.status,
            },
          ],
        },
        mapping: {
          tests_area_level_id: tal.id,
          city_ids: values.city_ids ?? [],
          center_ids: values.center_ids ?? [],
          course_ids: values.course_ids ?? [],
          id_card_nos: idCardNos,
          start_date: values.date_range?.[0]?.toISOString() ?? null,
          end_date: values.date_range?.[1]?.toISOString() ?? null,
        },
      };

      const res = await fetch("/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      let json: any;
      try {
        json = JSON.parse(txt);
      } catch {
        throw new Error(txt || "Server response error");
      }

      if (!res.ok || !json.success) {
        if (json.missing_ids?.length) {
          message.error(
            `Some id_card_nos do not exist in user_courses: ${json.missing_ids.join(", ")}`
          );
        }
        throw new Error(json.error || `Failed to save test & mapping (HTTP ${res.status})`);
      }

      message.success("Test created and mapping saved");
      setAddVisible(false);
      addForm.resetFields();

      // Refresh the table to show the new test
      fetchTests();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Failed to create test & mapping");
    } finally {
      setAddSubmitting(false);
    }
  };

  // -------------------------
  // Table columns (existing)
  // -------------------------
  const columns: ColumnsType<FlattenedRow> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      ...getColumnSearchProps("id"),
    },
    {
      title: "Test Ref",
      dataIndex: "test_ref",
      key: "test_ref",
      width: 150,
      render: (v) => v || <Text type="secondary">—</Text>,
      ...getColumnSearchProps("test_ref"),
    },
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
      width: 250,
      render: (v) => <Text strong>{v}</Text>,
      ...getColumnSearchProps("testName"),
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      width: 120,
      ...getColumnSearchProps("area"),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 120,
      ...getColumnSearchProps("level"),
    },
    {
      title: "Test Types",
      dataIndex: "testTypes",
      key: "testTypes",
      width: 200,
      ellipsis: true,
      ...getColumnSearchProps("testTypes"),
    },
    {
      title: "Courses",
      dataIndex: "courseNames",
      key: "courseNames",
      width: 200,
      ellipsis: true,
      ...getColumnSearchProps("courseNames"),
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      width: 180,
      render: (v) => v ? new Date(v).toLocaleString() : <Text type="secondary">—</Text>,
      ...getColumnSearchProps("start_date"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      width: 180,
      render: (v) => v ? new Date(v).toLocaleString() : <Text type="secondary">—</Text>,
      ...getColumnSearchProps("end_date"),
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      key: "vendorName",
      width: 150,
      ...getColumnSearchProps("vendorName"),
    },
    {
      title: "Test Link",
      dataIndex: "vendorTestLink",
      key: "vendorTestLink",
      width: 200,
      ellipsis: true,
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer">
            Link
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
      ...getColumnSearchProps("vendorTestLink"),
    },
    {
      title: "Solution Link",
      dataIndex: "solution",
      key: "solution",
      width: 200,
      ellipsis: true,
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer">
            Link
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
      ...getColumnSearchProps("solution"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 220,
      render: (_: any, rec: FlattenedRow) => (
        <Space>
          <Button size="small" onClick={() => openViewCourses(rec)}>
            Courses
          </Button>
          <Button size="small" onClick={() => openEditTest(rec)}>Edit</Button>
          <Popconfirm 
            title="Delete test?" 
            description="This will delete the test permanently."
            onConfirm={() => deleteTest(rec.id)} 
            okText="Delete" 
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // -------------------------
  // Render
  // -------------------------
  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Tests
          </Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" onClick={handleOpenTestTypes}>
              Test Types
            </Button>
            <Button type="primary" onClick={handleOpenTestAreaLevel}>
              Add Test Area Level
            </Button>
            <Button type="primary" onClick={openAddTests}>
              Add Tests
            </Button>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          background: "#f9f9f9",
          borderRadius: "8px",
          border: "1px dashed #d9d9d9"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
          <Title level={4}>No Tests Found</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            Get started by creating your first test. Click the "Add Tests" button above.
          </Text>
          <div style={{ marginTop: "16px", padding: "16px", background: "#fff", borderRadius: "6px", textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
            <Text strong>Steps to add a test:</Text>
            <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
              <li>Click <strong>"Test Types"</strong> to create test types (if not already done)</li>
              <li>Click <strong>"Add Test Area Level"</strong> to define area & level combinations</li>
              <li>Click <strong>"Add Tests"</strong> to create a new test with mapping</li>
            </ol>
          </div>
        </div>
      ) : (
        <Table
          dataSource={rows}
          columns={columns}
          pagination={{ 
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tests`,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          rowKey={(r) => r.key}
          scroll={{ x: 2400 }}
        />
      )}

      {/* Add Tests Modal (single-submit for 2 inserts) */}
      <Modal
        title="Add Test & Map Availability"
        open={addVisible}
        onCancel={() => setAddVisible(false)}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <Form form={addForm} layout="vertical" onFinish={onSubmitAddTests}>
          <Title level={5} style={{ marginTop: 0 }}>
            1) Test Details
          </Title>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="test_ref" label="Test Ref" rules={[{ required: true, message: "Enter test ref" }]}>
                <Input placeholder="e.g. MOCK-SEP-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: "Enter test name" }]}>
                <Input placeholder="e.g. September Full-Length Mock 1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Short description..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="vendorName" label="Vendor Name" rules={[{ required: true, message: "Enter vendor name" }]}>
                <Input placeholder="e.g. TestVendorX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="test_link" label="Vendor Test Link" rules={[{ required: true, message: "Enter test link" }]}>
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="status" label="Vendor Status" valuePropName="checked" tooltip="Only 'true' vendors are shown in list">
                <Switch checkedChildren="true" unCheckedChildren="false" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="solution" label="Solution (optional)">
                <Input placeholder="URL or short note" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5} style={{ marginTop: 0 }}>
            2) Availability Mapping
          </Title>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="city_ids" label="City" rules={[{ required: true, message: "Select at least one city" }]}>
                <Select mode="multiple" placeholder="Select city(s)" options={cities.map((c) => ({ label: c.label, value: c.id }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="center_ids" label="Center" rules={[{ required: true, message: "Select at least one center" }]}>
                <Select
                  mode="multiple"
                  placeholder="Select center(s)"
                  options={centers.map((c) => ({ label: c.label, value: c.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="course_ids" label="Course" rules={[{ required: true, message: "Select at least one course" }]}>
                <Select
                  mode="multiple"
                  placeholder="Select course(s)"
                  options={courses.map((c) => ({ label: c.label, value: c.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="id_card_nos"
            label="Students"
            rules={[{ required: true, message: "Select at least one student" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select students"
              showSearch
              filterOption={(input, option) => {
                const label = String(option?.label || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              options={users.map((u) => ({ 
                label: u.label, 
                value: u.id_card_no 
              }))}
              maxTagCount="responsive"
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="area" label="Area" rules={[{ required: true, message: "Select area" }]}>
                <Select
                  showSearch
                  placeholder="Select area"
                  options={areas.map((a) => ({ label: a, value: a }))}
                  onChange={() => {
                    // clear the level if area changed
                    addForm.setFieldsValue({ level: undefined });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* <Form.Item name="level" label="Level" rules={[{ required: true, message: "Select level" }]}>
                <Select
                  showSearch
                  placeholder="Select level"
                  options={levelsForSelectedArea.map((l) => ({ label: l, value: l }))}
                />
              </Form.Item> */}

              <Form.Item name="level" label="Level" rules={[{ required: true, message: "Select level" }]}>
                <Select
                  showSearch
                  placeholder="Select level"
                  options={levelOptions}
                  disabled={!selectedArea}
                />
              </Form.Item>

            </Col>
          </Row>

          <Form.Item
            name="date_range"
            label="Start / End Date"
            rules={[{ required: true, message: "Pick start and end date" }]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} showTime />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setAddVisible(false)} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={addSubmitting}>
                Save Test & Mapping
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Test Modal */}
      <Modal
        title="Edit Test"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={submitEditTest}
        confirmLoading={editSubmitting}
        destroyOnHidden
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="id" hidden><Input /></Form.Item>

          <Form.Item name="test_ref" label="Test Ref">
            <Input placeholder="e.g., MOCK-SEP-01" />
          </Form.Item>

          <Form.Item name="name" label="Test Name" rules={[{ required: true, message: "Enter test name" }]}>
            <Input placeholder="Test name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description..." />
          </Form.Item>

          <Form.Item name="solution" label="Solution Link">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Courses Modal */}
      <Modal
        title="Manage Test Courses"
        open={coursesVisible}
        onCancel={() => setCoursesVisible(false)}
        onOk={submitCourses}
        confirmLoading={coursesSubmitting}
        destroyOnHidden
        width={600}
      >
        <Spin spinning={coursesLoading}>
          <Form form={coursesForm} layout="vertical">
            <Form.Item 
              name="course_id" 
              label="Select Courses"
              extra="Select all courses where this test should be available"
            >
              <Select
                mode="multiple"
                placeholder="Select courses"
                showSearch
                loading={coursesLoading}
                filterOption={(input, option) => {
                  const label = String(option?.label || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                style={{ width: "100%" }}
              >
                {Array.from(coursesLookup.entries()).map(([id, name]) => (
                  <Select.Option key={id} value={id}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {selectedCourses.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <Text type="secondary" strong>Currently assigned courses:</Text>
                <div style={{ marginTop: "8px" }}>
                  <Space wrap>
                    {selectedCourses.map((courseId) => (
                      <div key={courseId} style={{ 
                        padding: "4px 8px", 
                        background: "#f0f5ff", 
                        borderRadius: "4px",
                        border: "1px solid #d6e4ff",
                        fontSize: "12px"
                      }}>
                        {coursesLookup.get(courseId) || `Course ID: ${courseId}`}
                      </div>
                    ))}
                  </Space>
                </div>
              </div>
            )}
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
