"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
    Button, Modal, Form, Input, Select, Switch, Space, Typography, message, 
    Table, Tag, Popconfirm 
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { InputRef } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { useRouter, useParams } from "next/navigation";

const { Title, Text } = Typography;

type City = { id: number; city: string };
type Center = { id: number; center: string; city_id: number };
type Course = { id: number; coursename: string };
type Batch = { id: number; batch_code: string };
type StorageType = "URL" | "PATH";

type NavContent = {
    id: number;
    type: string;
    label: string;
    storage: string;
    url: string | null;
    path: string | null;
    id_card_nos: string[];
    isactive: boolean;
    city_id: number[];
    center_id: number[];
    course_id: number[];
    batch_id: number[];
    city_id_count?: number;
    center_id_count?: number;
    course_id_count?: number;
    batch_id_count?: number;
    icon_name: string | null;
    test_type_id: number | null;
    is_navigation: boolean;
    created_by: number | null;
};

export default function NavContentsPage() {

    const router = useRouter();
    const { locale } = useParams() as { locale: string };

    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [openGeneralInfo, setOpenGeneralInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // data
    const [navContents, setNavContents] = useState<NavContent[]>([]);

    // edit modal
    const [editVisible, setEditVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState<NavContent | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editLoading, setEditLoading] = useState<number | null>(null);

    // local UI state (replaces Form.useWatch to avoid warnings)
    const [storageSel, setStorageSel] = useState<StorageType>("URL");
    const [editStorageSel, setEditStorageSel] = useState<StorageType>("URL");
    const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
    const [selectedCenterIds, setSelectedCenterIds] = useState<number[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [editSelectedCityIds, setEditSelectedCityIds] = useState<number[]>([]);
    const [editSelectedCenterIds, setEditSelectedCenterIds] = useState<number[]>([]);
    const [editSelectedCourseIds, setEditSelectedCourseIds] = useState<number[]>([]);

    // dropdown data
    const [cities, setCities] = useState<City[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [editCenters, setEditCenters] = useState<Center[]>([]);
    const [editCourses, setEditCourses] = useState<Course[]>([]);
    const [editBatches, setEditBatches] = useState<Batch[]>([]);

    // search refs
    const searchInput = useRef<InputRef>(null);

    // API helpers
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

    // fetch all nav_contents
    const fetchNavContents = async () => {
        try {
            setTableLoading(true);
            const res = await fetch(`/api/admin/nav_contents?resource=list`);
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch nav contents");
            }
            
            setNavContents(data?.items ?? []);
        } catch (error: any) {
            message.error(error?.message || "Failed to load nav contents");
        } finally {
            setTableLoading(false);
        }
    };

    // mount
    useEffect(() => {
        loadCities();
        fetchNavContents();
    }, []);

    // id_card_no async validator
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

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const payload = {
                type: "general_info",
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
                created_by: 101,
            };

            const res = await fetch("/api/admin/nav_contents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to create");

            message.success("General info saved");
            setOpenGeneralInfo(false);
            form.resetFields();
            // reset local state
            setStorageSel("URL");
            setSelectedCityIds([]);
            setSelectedCenterIds([]);
            setSelectedCourseIds([]);
            setCenters([]); setCourses([]); setBatches([]);
            // refresh table
            fetchNavContents();
        } catch (e: any) {
            message.error(e?.message || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    const onOpenGeneralInfo = () => {
        setOpenGeneralInfo(true);
        // set defaults each open
        setStorageSel("URL");
        form.setFieldsValue({
            isactive: true,
            storage: "URL",
            city_id: [],
            center_id: [],
            course_id: [],
            batch_id: [],
        });
    };

    // change handlers (drive dependent dropdowns)
    const handleCityChange = async (ids: number[]) => {
        setSelectedCityIds(ids);
        // form.setFieldValue("city_id", ids);
        form.setFieldsValue({ center_id: [], course_id: [], batch_id: [] });
        // clear deeper selections
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
        // form.setFieldValue("center_id", ids);
        form.setFieldsValue({ course_id: [], batch_id: [] });

        // clear deeper selections
        setSelectedCourseIds([]);
        form.setFieldsValue({ course_id: [], batch_id: [] });
        setCourses([]); setBatches([]);

        await loadCourses(selectedCityIds, ids);
        await loadBatches(selectedCityIds, ids, []);
    };

    const handleCourseChange = async (ids: number[]) => {
        setSelectedCourseIds(ids);
        form.setFieldsValue({ batch_id: [] });
        setBatches([]);
        await loadBatches(selectedCityIds, selectedCenterIds, ids);
    };

    // --- EDIT HANDLERS ---
    const loadEditCenters = async (cityIds: number[]) => {
        try {
            const res = await fetch(`/api/admin/nav_contents?resource=centers&cityIds=${cityIds.join(",")}`);
            const data = await res.json();
            return data?.items ?? [];
        } catch {
            message.error("Failed to load centers");
            return [];
        }
    };

    const loadEditCourses = async (cityIds: number[], centerIds: number[]) => {
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

    const loadEditBatches = async (cityIds: number[], centerIds: number[], courseIds: number[]) => {
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

    const handleEditCityChange = async (ids: number[]) => {
        setEditSelectedCityIds(ids);
        setEditSelectedCenterIds([]);
        setEditSelectedCourseIds([]);
        editForm.setFieldsValue({ center_id: [], course_id: [], batch_id: [] });
        setEditCenters([]);
        setEditCourses([]);
        setEditBatches([]);
        if (ids.length) {
            const c = await loadEditCenters(ids);
            setEditCenters(c);
            const crs = await loadEditCourses(ids, []);
            setEditCourses(crs);
            const b = await loadEditBatches(ids, [], []);
            setEditBatches(b);
        }
    };

    const handleEditCenterChange = async (ids: number[]) => {
        setEditSelectedCenterIds(ids);
        setEditSelectedCourseIds([]);
        editForm.setFieldsValue({ course_id: [], batch_id: [] });
        setEditCourses([]);
        setEditBatches([]);
        const crs = await loadEditCourses(editSelectedCityIds, ids);
        setEditCourses(crs);
        const b = await loadEditBatches(editSelectedCityIds, ids, []);
        setEditBatches(b);
    };

    const handleEditCourseChange = async (ids: number[]) => {
        setEditSelectedCourseIds(ids);
        editForm.setFieldsValue({ batch_id: [] });
        setEditBatches([]);
        const b = await loadEditBatches(editSelectedCityIds, editSelectedCenterIds, ids);
        setEditBatches(b);
    };

    const openEdit = async (record: NavContent) => {
        try {
            setEditLoading(record.id);
            
            // Check if record has too many IDs (corrupted data)
            const totalIds = (record.city_id_count || 0) + 
                           (record.center_id_count || 0) + 
                           (record.course_id_count || 0) + 
                           (record.batch_id_count || 0);
            
            if (totalIds > 1000) {
                message.error({
                    content: `Cannot edit: Record has ${totalIds.toLocaleString()} IDs (corrupted data). Please clean the data first.`,
                    duration: 5,
                });
                return;
            }

            // Fetch full record details (with all IDs, not truncated)
            const res = await fetch(`/api/admin/nav_contents?resource=detail&id=${record.id}`);
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch record details");
            }
            
            const fullRecord = data.item;
            setEditingRecord(fullRecord);
            setEditStorageSel(fullRecord.storage as StorageType);
            setEditSelectedCityIds(fullRecord.city_id || []);
            setEditSelectedCenterIds(fullRecord.center_id || []);
            setEditSelectedCourseIds(fullRecord.course_id || []);

            // Load dependent dropdowns
            if (fullRecord.city_id && fullRecord.city_id.length > 0) {
                const c = await loadEditCenters(fullRecord.city_id);
                setEditCenters(c);
                const crs = await loadEditCourses(fullRecord.city_id, fullRecord.center_id || []);
                setEditCourses(crs);
                const b = await loadEditBatches(fullRecord.city_id, fullRecord.center_id || [], fullRecord.course_id || []);
                setEditBatches(b);
            }

            editForm.setFieldsValue({
                label: fullRecord.label,
                storage: fullRecord.storage,
                url: fullRecord.url,
                path: fullRecord.path,
                id_card_nos: fullRecord.id_card_nos || [],
                isactive: fullRecord.isactive,
                city_id: fullRecord.city_id,
                center_id: fullRecord.center_id,
                course_id: fullRecord.course_id,
                batch_id: fullRecord.batch_id,
            });
            setEditVisible(true);
        } catch (error: any) {
            message.error(error?.message || "Failed to load record for editing");
        } finally {
            setEditLoading(null);
        }
    };

    const submitEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setEditSubmitting(true);

            const payload = {
                id: editingRecord?.id,
                label: values.label,
                storage: values.storage,
                url: values.storage === "URL" ? values.url ?? null : null,
                path: values.storage === "PATH" ? values.path ?? null : null,
                id_card_nos: values.id_card_nos ?? [],
                isactive: values.isactive,
                city_id: values.city_id ?? [],
                center_id: values.center_id ?? [],
                course_id: values.course_id ?? [],
                batch_id: values.batch_id ?? [],
            };

            const res = await fetch("/api/admin/nav_contents", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to update");

            message.success("Record updated successfully");
            setEditVisible(false);
            editForm.resetFields();
            setEditingRecord(null);
            setEditCenters([]);
            setEditCourses([]);
            setEditBatches([]);
            fetchNavContents();
        } catch (e: any) {
            message.error(e?.message || "Update failed");
        } finally {
            setEditSubmitting(false);
        }
    };

    const deleteRecord = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/nav_contents?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
            message.success("Record deleted successfully");
            fetchNavContents();
        } catch (e: any) {
            message.error(e?.message || "Delete failed");
        }
    };

    // --- SEARCH FILTER ---
    const getColumnSearchProps = (dataIndex: keyof NavContent) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
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
                    <Button onClick={() => { clearFilters && clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
        onFilter: (value: any, record: NavContent) =>
            (record[dataIndex] ?? "")
                .toString()
                .toLowerCase()
                .includes((value as string).toLowerCase()),
        onFilterDropdownOpenChange: (visible: boolean) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
    });

    // --- TABLE COLUMNS ---
    const columns: ColumnsType<NavContent> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            ...getColumnSearchProps("id"),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 120,
            render: (v: string) => (
                <Tag color={
                    v === "general_info" ? "blue" :
                    v === "buttons" ? "green" :
                    v === "tests" ? "orange" :
                    v === "accordion" ? "purple" : "default"
                }>
                    {v}
                </Tag>
            ),
            ...getColumnSearchProps("type"),
        },
        {
            title: "Label",
            dataIndex: "label",
            key: "label",
            width: 200,
            ...getColumnSearchProps("label"),
        },
        {
            title: "Storage",
            dataIndex: "storage",
            key: "storage",
            width: 100,
            render: (v: string) => <Tag>{v}</Tag>,
        },
        {
            title: "URL/Path",
            key: "link",
            width: 250,
            ellipsis: true,
            render: (_: any, rec: NavContent) => (
                rec.storage === "URL" && rec.url ? (
                    <a href={rec.url} target="_blank" rel="noopener noreferrer">{rec.url}</a>
                ) : rec.storage === "PATH" && rec.path ? (
                    <Text code>{rec.path}</Text>
                ) : (
                    <Text type="secondary">—</Text>
                )
            ),
        },
        {
            title: "Active",
            dataIndex: "isactive",
            key: "isactive",
            width: 80,
            render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? "Yes" : "No"}</Tag>,
        },
        {
            title: "ID Cards",
            dataIndex: "id_card_nos",
            key: "id_card_nos",
            width: 150,
            render: (v: string[]) => (
                v && v.length > 0 ? (
                    <Text>{v.join(", ")}</Text>
                ) : (
                    <Text type="secondary">—</Text>
                )
            ),
        },
        {
            title: "City IDs",
            key: "city_id",
            width: 180,
            render: (_: any, rec: NavContent) => {
                const count = rec.city_id_count || 0;
                const ids = rec.city_id || [];
                if (count === 0) return <Text type="secondary">—</Text>;
                return (
                    <Text>
                        {ids.slice(0, 3).join(", ")}
                        {count > 3 && <Text type="secondary"> ...+{count - 3} more</Text>}
                        {count <= 3 && count > 0 && <Text type="secondary"> ({count})</Text>}
                    </Text>
                );
            },
        },
        {
            title: "Center IDs",
            key: "center_id",
            width: 180,
            render: (_: any, rec: NavContent) => {
                const count = rec.center_id_count || 0;
                const ids = rec.center_id || [];
                if (count === 0) return <Text type="secondary">—</Text>;
                return (
                    <Text>
                        {ids.slice(0, 3).join(", ")}
                        {count > 3 && <Text type="secondary"> ...+{count - 3} more</Text>}
                        {count <= 3 && count > 0 && <Text type="secondary"> ({count})</Text>}
                    </Text>
                );
            },
        },
        {
            title: "Course IDs",
            key: "course_id",
            width: 180,
            render: (_: any, rec: NavContent) => {
                const count = rec.course_id_count || 0;
                const ids = rec.course_id || [];
                if (count === 0) return <Text type="secondary">—</Text>;
                return (
                    <Text>
                        {ids.slice(0, 3).join(", ")}
                        {count > 3 && <Text type="secondary"> ...+{count - 3} more</Text>}
                        {count <= 3 && count > 0 && <Text type="secondary"> ({count})</Text>}
                    </Text>
                );
            },
        },
        {
            title: "Batch IDs",
            key: "batch_id",
            width: 180,
            render: (_: any, rec: NavContent) => {
                const count = rec.batch_id_count || 0;
                const ids = rec.batch_id || [];
                if (count === 0) return <Text type="secondary">—</Text>;
                return (
                    <Text>
                        {ids.slice(0, 3).join(", ")}
                        {count > 3 && <Text type="secondary"> ...+{count - 3} more</Text>}
                        {count <= 3 && count > 0 && <Text type="secondary"> ({count})</Text>}
                    </Text>
                );
            },
        },
        {
            title: "Test Type ID",
            dataIndex: "test_type_id",
            key: "test_type_id",
            width: 120,
            render: (v: number | null) => (
                v ? <Text>{v}</Text> : <Text type="secondary">—</Text>
            ),
        },
        {
            title: "Icon Name",
            dataIndex: "icon_name",
            key: "icon_name",
            width: 120,
            render: (v: string | null) => (
                v ? <Text>{v}</Text> : <Text type="secondary">—</Text>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right" as const,
            width: 230,
            render: (_: any, rec: NavContent) => (
                <Space>
                    <Button 
                        size="small"
                        type="default"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/${locale}/admin/nav_contents/accordion?parent_id=${rec.id}`);
                        }}
                        disabled={rec.type !== "accordion"}
                        title={rec.type !== "accordion" ? "Only available for accordion type" : "Add sub-accordion"}
                    >
                        Add Accordion
                    </Button>
                    <Button 
                        size="small" 
                        type="default"
                        loading={editLoading === rec.id}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEdit(rec);
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this record?"
                        description="This action cannot be undone."
                        onConfirm={() => deleteRecord(rec.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" type="default" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            {/* Header Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Navigation Contents
                </Title>

                {/* Top Right Buttons */}
                <Space>
                    <Button onClick={() => router.push(`/${locale}/admin/nav_contents/accordion`)}>Add Accordion</Button>
                    <Button onClick={onOpenGeneralInfo}>General Info</Button>
                    <Button onClick={() => router.push(`/${locale}/admin/nav_contents/buttons`)}>Buttons</Button>
                    <Button onClick={() => router.push(`/${locale}/admin/nav_contents/tests`)}>Tests</Button>
                </Space>
            </div>

            {/* Data Table */}
            <Table
                columns={columns}
                dataSource={navContents}
                rowKey="id"
                loading={tableLoading}
                scroll={{ x: 2500 }}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                locale={{
                    emptyText: (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                            <Text type="secondary">
                                No navigation content records found.
                                <br />
                                Click one of the buttons above to create your first entry.
                            </Text>
                        </div>
                    ),
                }}
            />

            {/* General Info Modal/Form */}
            <Modal
                title="Add General Info"
                open={openGeneralInfo}
                onOk={onSubmit}
                okText="Save"
                confirmLoading={loading}
                onCancel={() => {
                    setOpenGeneralInfo(false);
                    form.resetFields();
                    setStorageSel("URL");
                    setSelectedCityIds([]); setSelectedCenterIds([]); setSelectedCourseIds([]);
                    setCenters([]); setCourses([]); setBatches([]);
                }}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    {/* 1) label */}
                    <Form.Item
                        label="Label"
                        name="label"
                        rules={[{ required: true, message: "Please enter a label" }]}
                    >
                        <Input placeholder="e.g. About CAT/MBA" />
                    </Form.Item>

                    {/* 2) storage */}
                    <Form.Item
                        label="Storage"
                        name="storage"
                        rules={[{ required: true, message: "Please select storage type" }]}
                    >
                        <Select
                            options={[
                                { label: "URL", value: "URL" },
                                { label: "PATH", value: "PATH" },
                            ]}
                            onChange={(v: StorageType) => setStorageSel(v)}
                        />
                    </Form.Item>

                    {/* 3) conditional url/path */}
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

                    {/* 4) id_card_no with validation */}
                    <Form.Item
                        label="ID Card No"
                        name="id_card_no"
                        validateFirst
                        rules={[
                            { required: true, message: "Please enter an ID Card No" },
                            { validator: validateIdCard },
                        ]}
                        validateTrigger="onBlur"
                        help={
                            form.getFieldError("id_card_no").length ? "No user exists" : undefined
                        }
                        validateStatus={form.getFieldError("id_card_no").length ? "error" : undefined}
                    >
                        <Input placeholder="e.g. T123456" />
                    </Form.Item>

                    {/* 5) isactive switch */}
                    <Form.Item label="Active" name="isactive" valuePropName="checked" initialValue={true}>
                        <Switch />
                    </Form.Item>

                    {/* 6) Cities */}
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

                    {/* 7) Centers (by cities) */}
                    <Form.Item label="Centers" name="center_id">
                        <Select
                            mode="multiple"
                            placeholder={(form.getFieldValue("city_id") || []).length ? "Select center(s)" : "Select city first"}
                            disabled={!(form.getFieldValue("city_id") || []).length}
                            value={selectedCenterIds}
                            onChange={handleCenterChange}
                            options={centers.map((c) => ({ label: c.center, value: c.id }))}
                        />
                    </Form.Item>

                    {/* 8) Courses (by cities/centers) */}
                    <Form.Item label="Courses" name="course_id">
                        {/* <Select
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
                        /> */}
                        <Select
                            mode="multiple"
                            placeholder={
                                (form.getFieldValue("city_id") || []).length || (form.getFieldValue("center_id") || []).length
                                    ? "Select course(s)"
                                    : "Select city/center first"
                            }
                            disabled={!((form.getFieldValue("city_id") || []).length || (form.getFieldValue("center_id") || []).length)}
                            onChange={handleCourseChange}
                            options={courses.map(c => ({ label: c.coursename, value: c.id }))}
                        />
                    </Form.Item>

                    {/* 9) Batches (by city/center/course) */}
                    <Form.Item label="Batches" name="batch_id">
                        {/* <Select
                            mode="multiple"
                            placeholder={
                                selectedCityIds.length || selectedCenterIds.length || selectedCourseIds.length
                                    ? "Select batch(es)"
                                    : "Select city/center/course first"
                            }
                            disabled={
                                !(selectedCityIds.length || selectedCenterIds.length || selectedCourseIds.length)
                            }
                            options={batches.map((b) => ({ label: b.batch_code, value: b.id }))}
                        /> */}

                        <Select
                            mode="multiple"
                            placeholder={
                                (form.getFieldValue("city_id") || []).length ||
                                    (form.getFieldValue("center_id") || []).length ||
                                    (form.getFieldValue("course_id") || []).length
                                    ? "Select batch(es)"
                                    : "Select city/center/course first"
                            }
                            disabled={
                                !((form.getFieldValue("city_id") || []).length ||
                                    (form.getFieldValue("center_id") || []).length ||
                                    (form.getFieldValue("course_id") || []).length)
                            }
                            options={batches.map(b => ({ label: b.batch_code, value: b.id }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Nav Content"
                open={editVisible}
                onOk={submitEdit}
                okText="Save"
                confirmLoading={editSubmitting}
                onCancel={() => {
                    setEditVisible(false);
                    editForm.resetFields();
                    setEditingRecord(null);
                    setEditCenters([]);
                    setEditCourses([]);
                    setEditBatches([]);
                }}
                destroyOnHidden
                width={600}
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label="Label"
                        name="label"
                        rules={[{ required: true, message: "Please enter a label" }]}
                    >
                        <Input placeholder="e.g. About CAT/MBA" />
                    </Form.Item>

                    <Form.Item
                        label="Storage"
                        name="storage"
                        rules={[{ required: true, message: "Please select storage type" }]}
                    >
                        <Select
                            options={[
                                { label: "URL", value: "URL" },
                                { label: "PATH", value: "PATH" },
                            ]}
                            onChange={(v: StorageType) => setEditStorageSel(v)}
                        />
                    </Form.Item>

                    {editStorageSel === "URL" && (
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
                    {editStorageSel === "PATH" && (
                        <Form.Item
                            label="Path"
                            name="path"
                            rules={[{ required: true, message: "Please enter a path" }]}
                        >
                            <Input placeholder="/some/path" />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="ID Card Numbers"
                        name="id_card_nos"
                        help="Enter multiple ID card numbers (e.g., T123456, T789012)"
                    >
                        <Select
                            mode="tags"
                            placeholder="Type ID card numbers and press Enter"
                            tokenSeparators={[",", " "]}
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item label="Active" name="isactive" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item label="Cities" name="city_id">
                        <Select
                            mode="multiple"
                            placeholder="Select city/cities"
                            optionFilterProp="label"
                            value={editSelectedCityIds}
                            onChange={handleEditCityChange}
                            options={cities.map((c) => ({ label: c.city, value: c.id }))}
                        />
                    </Form.Item>

                    <Form.Item label="Centers" name="center_id">
                        <Select
                            mode="multiple"
                            placeholder={editSelectedCityIds.length ? "Select center(s)" : "Select city first"}
                            disabled={!editSelectedCityIds.length}
                            value={editSelectedCenterIds}
                            onChange={handleEditCenterChange}
                            options={editCenters.map((c) => ({ label: c.center, value: c.id }))}
                        />
                    </Form.Item>

                    <Form.Item label="Courses" name="course_id">
                        <Select
                            mode="multiple"
                            placeholder={
                                editSelectedCityIds.length || editSelectedCenterIds.length
                                    ? "Select course(s)"
                                    : "Select city/center first"
                            }
                            disabled={!(editSelectedCityIds.length || editSelectedCenterIds.length)}
                            value={editSelectedCourseIds}
                            onChange={handleEditCourseChange}
                            options={editCourses.map((c) => ({ label: c.coursename, value: c.id }))}
                        />
                    </Form.Item>

                    <Form.Item label="Batches" name="batch_id">
                        <Select
                            mode="multiple"
                            placeholder={
                                editSelectedCityIds.length || editSelectedCenterIds.length || editSelectedCourseIds.length
                                    ? "Select batch(es)"
                                    : "Select city/center/course first"
                            }
                            disabled={!(editSelectedCityIds.length || editSelectedCenterIds.length || editSelectedCourseIds.length)}
                            options={editBatches.map((b) => ({ label: b.batch_code, value: b.id }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}



