// src/app/[locale]/admin/course_mappings/page.tsx
"use client";

import React, { useCallback, useState, useRef } from "react";
import {
    Typography,
    Alert,
    Spin,
    Button,
    message,
    Table,
    Space,
    Form,
    Input,
    Modal,
    DatePicker,
    Select,
    Popconfirm,
} from "antd";
import dayjs from "dayjs";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

type MappingRow = {
    mapping_id: number;
    batch_id: number | null;
    batch_code: string | null;
    city_id: number | null;
    city_name: string | null;
    center_id: number | null;
    center_name: string | null;
    course_id: number | null;
    coursename: string | null;
    variant_id: number | null;
    variant_name: string | null;
    registration_date?: string | null;
    validity_date?: string | null;
};

// helper to show dash when null/undefined/empty
const showOrDash = (v: any) => {
    if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return "-";
    return String(v);
};

// helper for dates
const showDateOrDash = (v?: string | null) => (v ? new Date(v).toLocaleString() : "-");

export default function Page() {
    const [form] = Form.useForm();
    const searchRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [mappings, setMappings] = useState<MappingRow[]>([]);
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [rawCount, setRawCount] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string>("");

    // lookups
    const [batches, setBatches] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);

    // edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editForm] = Form.useForm();
    const [current, setCurrent] = useState<MappingRow | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);


    const [addOpen, setAddOpen] = useState(false);
    const [addForm] = Form.useForm();
    const [addSubmitting, setAddSubmitting] = useState(false);


    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);

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

    // change these helpers (replace the previous definitions)

    const courseVariantFor = (courseId?: number | null) => {
        if (courseId == null) return null;         // handles null or undefined
        const c = courses.find(x => x.id === courseId);
        if (!c) return null;
        return c.variant_id ?? null;
    };

    const availableBatchesForCourse = (courseId?: number | null) => {
        if (courseId == null) return [];
        return batches.filter(b => b.course_id === courseId);
    };

    const availableCitiesForCourse = (courseId?: number | null) => {
        if (courseId == null) return [];
        const bs = availableBatchesForCourse(courseId);
        const cityIds = Array.from(new Set(bs.map(b => b.city_id).filter(Boolean)));
        return cities.filter(c => cityIds.includes(c.id));
    };

    const availableCentersForCourseAndCity = (courseId?: number | null, cityId?: number | null) => {
        if (courseId == null) return [];
        let bs = batches.filter(b => b.course_id === courseId);
        if (cityId != null) bs = bs.filter(b => b.city_id === cityId);
        const centerIds = Array.from(new Set(bs.map(b => b.center_id).filter(Boolean)));
        return centers.filter(c => centerIds.includes(c.id));
    };

    const availableBatchCodes = (courseId?: number | null, cityId?: number | null, centerId?: number | null) => {
        if (courseId == null) return [];
        let bs = batches.filter(b => b.course_id === courseId);
        if (cityId != null) bs = bs.filter(b => b.city_id === cityId);
        if (centerId != null) bs = bs.filter(b => b.center_id === centerId);
        return bs;
    };

    const fetchUserCourses = useCallback(async (id_card_no?: string) => {
        setErrorMsg("");
        setMappings([]);
        setUserInfo(null);
        setRawCount(0);

        const trimmed = id_card_no?.trim() ?? (form.getFieldValue("id_card_no") || "").trim();
        if (!trimmed) {
            setErrorMsg("Please enter user id_card_no");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/user-courses?id_card_no=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);

            setMappings(Array.isArray(json.mappings) ? json.mappings : []);
            setUserInfo(json.user ?? null);
            setRawCount(Number(json.raw_user_courses_count ?? 0));

            // set lookups if present
            setBatches(Array.isArray(json.lookups?.batches) ? json.lookups.batches : []);
            setCenters(Array.isArray(json.lookups?.centers) ? json.lookups.centers : []);
            setCities(Array.isArray(json.lookups?.cities) ? json.lookups.cities : []);
            setCourses(Array.isArray(json.lookups?.courses) ? json.lookups.courses : []);
            setVariants(Array.isArray(json.lookups?.variants) ? json.lookups.variants : []);
        } catch (e: any) {
            const msg = e?.message ?? "Failed to fetch user courses";
            setErrorMsg(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    }, [form]);

    // Open Add modal - ensure id_card_no present and lookups loaded
    // const openAddModal = async () => {
    //     const id = (form.getFieldValue("id_card_no") || "").trim();
    //     if (!id) {
    //         message.error("Please enter id_card_no before adding a course");
    //         return;
    //     }
    //     // If lookups are empty, fetch mappings (which returns lookups)
    //     if (!batches.length || !courses.length || !centers.length || !variants.length || !cities.length) {
    //         await fetchUserCourses(id);
    //     }
    //     addForm.resetFields();
    //     setAddOpen(true);
    // };


    const openAddModal = async () => {
        const id = (form.getFieldValue("id_card_no") || "").toString().trim();
        if (!id) {
            // show user-friendly message and focus the search input
            message.error("Please enter id_card_no before adding a course");
            // focus the search input so user can type immediately
            try {
                if (searchRef?.current) {
                    // Antd's Input.Search forwards ref to the input element
                    const el = searchRef.current.input ?? searchRef.current; // handle either form
                    el.focus && el.focus();
                } else {
                    // fallback: try document selector
                    const fallback = document.querySelector('input[placeholder="Enter id_card_no and press Enter or click Load"]') as HTMLInputElement | null;
                    fallback?.focus();
                }
            } catch (e) {
                // ignore focus errors
                // console.warn("focus failed", e);
            }
            return;
        }

        // If lookups are empty, fetch mappings (which returns lookups)
        if (!batches.length || !courses.length || !centers.length || !variants.length || !cities.length) {
            await fetchUserCourses(id);
        }

        setSelectedCourseId(null);
        setSelectedCityId(null);
        setSelectedCenterId(null);

        addForm.resetFields();
        setAddOpen(true);
    };


    // When course changes in Add form:
    const onAddCourseChange = (courseId: number) => {
        setSelectedCourseId(courseId);
        // auto-set variant_id in the form (if present)
        const variantId = courseVariantFor(courseId);
        if (variantId) {
            addForm.setFieldsValue({ variant_id: variantId });
        } else {
            addForm.setFieldsValue({ variant_id: null });
        }

        // clear downstream selections
        setSelectedCityId(null);
        setSelectedCenterId(null);
        addForm.setFieldsValue({ city_id: null, center_id: null, batch_id: null });
    };

    const onAddCityChange = (cityId: number) => {
        setSelectedCityId(cityId);
        setSelectedCenterId(null);
        addForm.setFieldsValue({ center_id: null, batch_id: null });
    };

    const onAddCenterChange = (centerId: number) => {
        setSelectedCenterId(centerId);
        addForm.setFieldsValue({ batch_id: null });
    };

    const submitAdd = async () => {
        try {
            setAddSubmitting(true);
            const vals = await addForm.validateFields();

            // gather payload
            const payload: any = {
                id_card_no: (form.getFieldValue("id_card_no") || "").trim(),
                batch_id: vals.batch_id ?? null,
                // user selected duplicates are optional; backend mainly uses batch_id
                course_id: vals.course_id ?? null,
                city_id: vals.city_id ?? null,
                center_id: vals.center_id ?? null,
                variant_id: vals.variant_id ?? null,
                validity_date: vals.validity_date ? vals.validity_date.toISOString() : null,
                registration_date: vals.registration_date ? vals.registration_date.toISOString() : new Date().toISOString(),
            };

            const res = await fetch("/api/admin/user-courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success !== true) throw new Error(json?.error || `Create failed (${res.status})`);

            message.success("Course mapping added");
            setAddOpen(false);
            // refresh mappings
            fetchUserCourses(payload.id_card_no);
        } catch (e: any) {
            message.error(e?.message ?? "Failed to add mapping");
        } finally {
            setAddSubmitting(false);
        }
    };

    // Open edit modal
    const openEdit = (rec: MappingRow) => {
        setCurrent(rec);
        editForm.setFieldsValue({
            mapping_id: rec.mapping_id,
            batch_id: rec.batch_id ?? null,
            registration_date: rec.registration_date ? dayjs(rec.registration_date) : null,
            validity_date: rec.validity_date ? dayjs(rec.validity_date) : null,
        });
        setEditOpen(true);
    };

    const submitEdit = async () => {
        try {
            setEditSubmitting(true);
            const vals = await editForm.validateFields();
            const payload: any = {
                mapping_id: vals.mapping_id,
                batch_id: vals.batch_id ?? null,
                registration_date: vals.registration_date ? vals.registration_date.toISOString() : null,
                validity_date: vals.validity_date ? vals.validity_date.toISOString() : null,
            };

            const res = await fetch("/api/admin/user-courses", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success !== true) throw new Error(json?.error || `Update failed (${res.status})`);

            message.success("Mapping updated");
            setEditOpen(false);
            setCurrent(null);
            fetchUserCourses(form.getFieldValue("id_card_no"));
        } catch (e: any) {
            message.error(e?.message ?? "Failed to update mapping");
        } finally {
            setEditSubmitting(false);
        }
    };

    const deleteMapping = async (mapping_id: number) => {
        try {
            const res = await fetch(`/api/admin/user-courses?mapping_id=${mapping_id}`, { method: "DELETE" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
            message.success("Mapping deleted");
            fetchUserCourses(form.getFieldValue("id_card_no"));
        } catch (e: any) {
            message.error(e?.message ?? "Failed to delete mapping");
        }
    };

    const columns = [
        { title: "ID", key: "idx", render: (_: any, __: any, i: number) => i + 1, width: 60 },
        {
            title: "Email",
            key: "email",
            width: 200,
            render: () => showOrDash(userInfo?.email),
            ...getColumnSearchProps("email"),
            onFilter: (value: any, record: any) => {
                const email = userInfo?.email || "";
                return email.toString().toLowerCase().includes(value.toLowerCase());
            },
        },
        {
            title: "Mobile",
            key: "mobile",
            width: 130,
            render: () => showOrDash(userInfo?.mobile),
            ...getColumnSearchProps("mobile"),
            onFilter: (value: any, record: any) => {
                const mobile = userInfo?.mobile || "";
                return mobile.toString().toLowerCase().includes(value.toLowerCase());
            },
        },
        {
            title: "Batch Code",
            dataIndex: "batch_code",
            key: "batch_code",
            width: 160,
            render: (v: string | null) => showOrDash(v),
            ...getColumnSearchProps("batch_code"),
        },
        {
            title: "Course",
            dataIndex: "coursename",
            key: "coursename",
            width: 260,
            ellipsis: { showTitle: false },
            render: (v: string | null, rec: MappingRow) => {
                // prefer readable coursename, but fall back to Course#id if name missing
                if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
                    return rec.course_id ? `Course#${rec.course_id}` : "-";
                }
                return (
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v}
                    </div>
                );
            },
            ...getColumnSearchProps("coursename"),
        },
        {
            title: "City",
            dataIndex: "city_name",
            key: "city_name",
            width: 140,
            render: (v: string | null) => showOrDash(v),
            ...getColumnSearchProps("city_name"),
        },
        {
            title: "Center",
            dataIndex: "center_name",
            key: "center_name",
            width: 160,
            render: (v: string | null) => showOrDash(v),
            ...getColumnSearchProps("center_name"),
        },

        {
            title: "Variant",
            dataIndex: "variant_name",
            key: "variant_name",
            width: 140,
            render: (v: string | null) => showOrDash(v),
            ...getColumnSearchProps("variant_name"),
        },
        {
            title: "Registration",
            dataIndex: "registration_date",
            key: "registration_date",
            render: (v: string | null) => showDateOrDash(v),
            width: 180,
            ...getColumnSearchProps("registration_date"),
        },
        {
            title: "Validity",
            dataIndex: "validity_date",
            key: "validity_date",
            render: (v: string | null) => showDateOrDash(v),
            width: 180,
            ...getColumnSearchProps("validity_date"),
        },
        {
            title: "Actions",
            key: "actions",
            width: 160,
            fixed: "right" as const,
            render: (_: any, rec: MappingRow) => (
                <Space>
                    <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
                    <Popconfirm title="Delete mapping?" onConfirm={() => deleteMapping(rec.mapping_id)} okText="Delete" okButtonProps={{ danger: true }}>
                        <Button size="small" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={3} className={styles.title}>User — Course Mappings</Title>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={openAddModal}
                        disabled={!userInfo}
                        title={!userInfo ? "Please search for a user first" : "Add new course mapping"}
                    >
                        Add New Course
                    </Button>
                </Space>
            </div>

            <Form form={form} layout="inline" onFinish={(vals) => fetchUserCourses(vals.id_card_no)} className={styles.searchForm}>
                <Form.Item name="id_card_no" rules={[{ required: true, message: "Please enter id_card_no" }]}>
                    <Input.Search ref={searchRef} placeholder="Enter id_card_no and press Enter or click Load" enterButton onSearch={(v) => fetchUserCourses(v)} style={{ width: 420 }} allowClear />
                </Form.Item>
                <Form.Item>
                    {/* <Button onClick={() => fetchUserCourses(form.getFieldValue("id_card_no") || "")}>Refresh</Button> */}
                </Form.Item>
            </Form>

            {!userInfo && !loading && !errorMsg && (
                <div style={{ marginTop: 12 }}>
                    <Alert 
                        type="info" 
                        showIcon 
                        message="Get Started" 
                        description="Enter a user's ID card number in the search box below and press Enter to view and manage their course mappings." 
                    />
                </div>
            )}

            {!!errorMsg && <div style={{ marginTop: 12 }}><Alert type="error" showIcon message="Error" description={errorMsg} /></div>}

            {userInfo && (
                <div style={{ 
                    marginTop: 12, 
                    padding: "12px 16px", 
                    background: "#f0f5ff", 
                    borderRadius: "8px",
                    border: "1px solid #d6e4ff"
                }}>
                    <div style={{ marginBottom: "8px" }}>
                        <strong style={{ fontSize: "16px" }}>
                            {userInfo.firstname ?? ""} {userInfo.lastname ?? ""}
                        </strong>
                        <span style={{ marginLeft: "12px", color: "#666" }}>
                            ID: {userInfo.id_card_no}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#555" }}>
                        {userInfo.email && (
                            <div>
                                <strong>Email:</strong> {userInfo.email}
                            </div>
                        )}
                        {userInfo.mobile && (
                            <div>
                                <strong>Mobile:</strong> {userInfo.mobile}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 12 }}>
                <Table
                    rowKey={(r: any) => r.mapping_id}
                    dataSource={mappings}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    className={styles.table}
                    scroll={{ x: 1530 }}
                />


                <Modal
                    title="Add Course Mapping"
                    open={addOpen}
                    onCancel={() => setAddOpen(false)}
                    onOk={submitAdd}
                    confirmLoading={addSubmitting}
                    destroyOnHidden
                >
                    <Form form={addForm} layout="vertical">
                        {/* 1) Course - user selects this first */}
                        <Form.Item label="Course" name="course_id" rules={[{ required: true, message: "Select course" }]}>
                            <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="Select course"
                                onChange={(val) => onAddCourseChange(Number(val))}
                            >
                                {courses.map(c => (
                                    <Select.Option key={c.id} value={c.id}>
                                        {c.coursename}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* 2) Variant - auto-filled from selected course (user can override if you want) */}
                        <Form.Item label="Variant" name="variant_id" rules={[{ required: false }]}>
                            <Select
                                placeholder="Variant (auto-filled from selected course)"
                                // keep disabled so user doesn't change variant accidentally (optional)
                                disabled
                            >
                                {/* show only the variant for selected course */}
                                {selectedCourseId
                                    ? (() => {
                                        const vid = courseVariantFor(selectedCourseId);
                                        if (!vid) return null;
                                        const v = variants.find(x => x.id === vid);
                                        if (!v) return null;
                                        return <Select.Option key={v.id} value={v.id}>{v.variant}</Select.Option>;
                                    })()
                                    : null}
                            </Select>
                        </Form.Item>

                        {/* 3) City - derived from batches that belong to the selected course */}
                        <Form.Item label="City" name="city_id" rules={[{ required: true, message: "Select city" }]}>
                            <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="Select city"
                                onChange={(val) => onAddCityChange(Number(val))}
                                disabled={!selectedCourseId}
                            >
                                {availableCitiesForCourse(selectedCourseId).map(c => (
                                    <Select.Option key={c.id} value={c.id}>
                                        {c.city}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* 4) Center - derived from batches filtered by course+city */}
                        <Form.Item label="Center" name="center_id" rules={[{ required: true, message: "Select center" }]}>
                            <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="Select center"
                                onChange={(val) => onAddCenterChange(Number(val))}
                                disabled={!selectedCourseId || !selectedCityId}
                            >
                                {availableCentersForCourseAndCity(selectedCourseId, selectedCityId).map(c => (
                                    <Select.Option key={c.id} value={c.id}>
                                        {c.center}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* 5) Batch Code - derived from course+city+center */}
                        <Form.Item label="Batch Code" name="batch_id" rules={[{ required: true, message: "Select batch" }]}>
                            <Select
                                showSearch
                                optionFilterProp="children"
                                placeholder="Select batch"
                                disabled={!selectedCourseId || !selectedCityId || !selectedCenterId}
                            >
                                {availableBatchCodes(selectedCourseId, selectedCityId, selectedCenterId).map(b => (
                                    <Select.Option key={b.id} value={b.id}>
                                        {b.batch_code}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* 6) Validity */}
                        <Form.Item label="Validity" name="validity_date">
                            <DatePicker showTime style={{ width: "100%" }} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>

            <Modal title="Edit Mapping" open={editOpen} onCancel={() => setEditOpen(false)} onOk={submitEdit} confirmLoading={editSubmitting} destroyOnHidden>
                <Form form={editForm} layout="vertical">
                    <Form.Item name="mapping_id" label="Mapping ID" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item name="batch_id" label="Batch" rules={[{ required: true, message: "Select batch" }]}>
                        <Select showSearch optionFilterProp="children" placeholder="Select batch">
                            {batches.map(b => (
                                <Select.Option key={b.id} value={b.id}>
                                    {b.batch_code}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="registration_date" label="Registration Date">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="validity_date" label="Validity Date">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}



























