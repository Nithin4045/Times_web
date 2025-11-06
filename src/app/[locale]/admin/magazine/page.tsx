// "use client";

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//     Table,
//     Space,
//     Button,
//     Modal,
//     Form,
//     Input,
//     InputNumber,
//     message,
//     Typography,
//     Popconfirm,
// } from "antd";

// const { Title } = Typography;

// type PriceObj = {
//     base?: number | null;
//     discount_price?: number | null;
//     discount_percent?: number | null;
//     discount_start_date?: string | null;
//     discount_end_date?: string | null;
// };

// type MagazineRow = {
//     id: number;
//     title: string;
//     year: number | null;
//     type: string | null;
//     price_one_year: PriceObj | number | null;
//     price_two_year: PriceObj | number | null;
//     created_at?: string | null;
//     updated_at?: string | null;
// };

// function formatPriceCell(v: PriceObj | number | null) {
//     if (v == null) return "";
//     // if it's a number just show it
//     if (typeof v === "number") return v;
//     // otherwise expect object
//     const base = typeof v.base === "number" ? v.base : null;
//     const disc = typeof v.discount_price === "number" ? v.discount_price : null;
//     const dp = typeof v.discount_percent === "number" ? v.discount_percent : null;
//     const start = v.discount_start_date ? new Date(v.discount_start_date).toLocaleDateString() : null;
//     const end = v.discount_end_date ? new Date(v.discount_end_date).toLocaleDateString() : null;

//     if (disc != null && dp != null) {
//         // e.g. "₹960 (20% off — until 15/02/2024)"
//         const period = end ? ` — until ${end}` : "";
//         return `₹${disc} (${dp}% off${period})`;
//     }
//     if (base != null) {
//         return `₹${base}`;
//     }
//     return "";
// }

// export default function Page() {
//     const [rows, setRows] = useState<MagazineRow[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [addOpen, setAddOpen] = useState(false);
//     const [adding, setAdding] = useState(false);
//     const [form] = Form.useForm();

//     const fetchMagazines = useCallback(async () => {
//         setLoading(true);
//         try {
//             const res = await fetch("/api/admin/magazines", { cache: "no-store" });
//             const json = await res.json().catch(() => ({}));
//             if (!res.ok || json?.success !== true) {
//                 throw new Error(json?.error || `Fetch failed (${res.status})`);
//             }
//             setRows(Array.isArray(json.data) ? json.data : []);
//         } catch (err: any) {
//             message.error(err?.message || "Failed to load magazines");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchMagazines();
//     }, [fetchMagazines]);

//     const openAdd = () => {
//         form.resetFields();
//         setAddOpen(true);
//     };

//     // const submitAdd = async () => {
//     //     try {
//     //         const values = await form.validateFields();
//     //         setAdding(true);

//     //         // const payload = {
//     //         //     title: (values.title ?? "").trim(),
//     //         //     year: values.year ?? null,
//     //         //     type: (values.type ?? "").trim(),
//     //         //     price_one_year: values.price_one_year ?? 0,
//     //         //     price_two_year: values.price_two_year ?? 0,
//     //         // };

//     //         const payload = {
//     //             magazine_id: (values.magazine_id ?? "").trim(),
//     //             title: (values.title ?? "").trim(),
//     //             year: values.year ?? null,
//     //             type: (values.type ?? "").trim(),
//     //             // keep behaviour simple: if admin provides a number, wrap into base number
//     //             // or you can later extend the form to accept detailed price objects
//     //             price_one_year: typeof values.price_one_year === "object" ? values.price_one_year : { base: values.price_one_year ?? 0 },
//     //             price_two_year: typeof values.price_two_year === "object" ? values.price_two_year : { base: values.price_two_year ?? 0 },
//     //         };


//     //         const res = await fetch("/api/admin/magazines", {
//     //             method: "POST",
//     //             headers: { "Content-Type": "application/json" },
//     //             body: JSON.stringify(payload),
//     //         });

//     //         const json = await res.json().catch(() => ({}));
//     //         if (!res.ok || json?.success !== true) {
//     //             if (res.status === 409) throw new Error(json?.error || "Duplicate");
//     //             throw new Error(json?.error || `Save failed (${res.status})`);
//     //         }

//     //         message.success("Magazine added");
//     //         setAddOpen(false);
//     //         fetchMagazines();
//     //     } catch (err: any) {
//     //         message.error(err?.message || "Failed to add magazine");
//     //     } finally {
//     //         setAdding(false);
//     //     }
//     // };

//     const submitAdd = async () => {
//   try {
//     const values = await form.validateFields();
//     setAdding(true);

//     const payload = {
//       magazine_id: (values.magazine_id ?? "").trim(),
//       title: (values.title ?? "").trim(),
//       nav_link: (values.nav_link ?? "").trim(),         // <-- include nav_link
//       year: values.year ?? null,
//       type: (values.type ?? "").trim(),
//       price_one_year: typeof values.price_one_year === "object"
//         ? values.price_one_year
//         : { base: values.price_one_year ?? 0 },
//       price_two_year: typeof values.price_two_year === "object"
//         ? values.price_two_year
//         : { base: values.price_two_year ?? 0 },
//     };

//     const res = await fetch("/api/admin/magazines", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     // better debugging: parse and show server response body even on non-OK
//     const json = await res.json().catch(() => ({}));
//     if (!res.ok || json?.success !== true) {
//       console.error("POST /api/admin/magazines failed:", res.status, json);
//       if (res.status === 409) throw new Error(json?.error || "Duplicate");
//       throw new Error(json?.error || `Save failed (${res.status})`);
//     }

//     message.success("Magazine added");
//     setAddOpen(false);
//     fetchMagazines();
//   } catch (err: any) {
//     console.error("submitAdd error:", err);
//     message.error(err?.message || "Failed to add magazine");
//   } finally {
//     setAdding(false);
//   }
// };

//     const deleteMagazine = async (id: number) => {
//         try {
//             const res = await fetch("/api/admin/magazines", {
//                 method: "DELETE",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ id }),
//             });
//             const json = await res.json().catch(() => ({}));
//             if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
//             message.success("Magazine deleted");
//             fetchMagazines();
//         } catch (err: any) {
//             message.error(err?.message || "Failed to delete magazine");
//         }
//     };

//     const columns = useMemo(
//         () => [
//             { title: "ID", dataIndex: "id", key: "id", width: 80 },
//             { title: "Name", dataIndex: "title", key: "title" },
//             { title: "Year", dataIndex: "year", key: "year", width: 140 },
//             { title: "Type", dataIndex: "type", key: "type", width: 140 },
//             {
//                 title: "1 year price",
//                 dataIndex: "price_one_year",
//                 key: "price_one_year",
//                 width: 150,
//                 render: (v: PriceObj | number | null) => formatPriceCell(v),
//             },

//             {
//                 title: "2 years price",
//                 dataIndex: "price_two_year",
//                 key: "price_two_year",
//                 width: 150,
//                 render: (v: PriceObj | number | null) => formatPriceCell(v),
//             },
//             {
//                 title: "Actions",
//                 key: "actions",
//                 width: 160,
//                 render: (_: any, record: MagazineRow) => (
//                     <Space>
//                         {/* Add edit later if needed */}
//                         <Popconfirm
//                             title={`Delete "${record.title}"?`}
//                             onConfirm={() => deleteMagazine(record.id)}
//                             okText="Delete"
//                             okButtonProps={{ danger: true }}
//                         >
//                             <Button danger size="small">Delete</Button>
//                         </Popconfirm>
//                     </Space>
//                 ),
//             },
//         ],
//         []
//     );

//     return (
//         <div style={{ padding: 16 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//                 <Title level={4} style={{ margin: 0 }}>Magazines</Title>
//                 <Space>
//                     <Button type="primary" onClick={openAdd}>Add magazine</Button>
//                 </Space>
//             </div>

//             <Table
//                 rowKey="id"
//                 dataSource={rows}
//                 columns={columns as any}
//                 loading={loading}
//                 pagination={{ pageSize: 10 }}
//             />

//             {/* <Modal
//                 open={addOpen}
//                 title="Add Magazine"
//                 onCancel={() => setAddOpen(false)}
//                 onOk={submitAdd}
//                 confirmLoading={adding}
//                 destroyOnHidden
//             >
//                 <Form form={form} layout="vertical" initialValues={{ price_one_year: 0, price_two_year: 0 }}>
//                     <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
//                         <Input />
//                     </Form.Item>

//                     <Form.Item name="year" label="Year" rules={[{ required: true, message: "Year is required" }]}>
//                         <InputNumber style={{ width: "100%" }} min={1900} max={3000} />
//                     </Form.Item>

//                     <Form.Item name="type" label="Type" rules={[{ required: true, message: "Type is required" }]}>
//                         <Input placeholder="e.g. Monthly / Weekly / Annual" />
//                     </Form.Item>

//                     <Form.Item name="price_one_year" label="1 year price" rules={[{ required: true }]}>
//                         <InputNumber style={{ width: "100%" }} min={0} />
//                     </Form.Item>

//                     <Form.Item name="price_two_year" label="2 years price" rules={[{ required: true }]}>
//                         <InputNumber style={{ width: "100%" }} min={0} />
//                     </Form.Item>
//                 </Form>
//             </Modal> */}

//             <Modal
//                 open={addOpen}
//                 title="Add Magazine"
//                 onCancel={() => setAddOpen(false)}
//                 onOk={submitAdd}
//                 confirmLoading={adding}
//                 destroyOnHidden
//             >
//                 <Form
//                     form={form}
//                     layout="vertical"
//                     initialValues={{ price_one_year: 0, price_two_year: 0 }}
//                 >
//                     <Form.Item
//                         name="magazine_id"
//                         label="Magazine ID"
//                         rules={[{ required: true, message: "Magazine ID is required" }]}
//                     >
//                         <Input placeholder="e.g. MAG2024FEB" />
//                     </Form.Item>

//                     <Form.Item
//                         name="title"
//                         label="Title"
//                         rules={[{ required: true, message: "Title is required" }]}
//                     >
//                         <Input />
//                     </Form.Item>

//                     <Form.Item
//                         name="nav_link"
//                         label="Navigation Link"
//                         rules={[{ required: true, message: "Nav link is required" }]}
//                     >
//                         <Input placeholder="https://example.com/magazine/issue" />
//                     </Form.Item>

//                     <Form.Item
//                         name="year"
//                         label="Year"
//                         rules={[{ required: true, message: "Year is required" }]}
//                     >
//                         <InputNumber style={{ width: "100%" }} min={1900} max={3000} />
//                     </Form.Item>

//                     <Form.Item
//                         name="type"
//                         label="Type"
//                         rules={[{ required: true, message: "Type is required" }]}
//                     >
//                         <Input placeholder="e.g. Monthly / Weekly / Annual" />
//                     </Form.Item>

//                     <Form.Item name="price_one_year" label="1 year price" rules={[{ required: true }]}>
//                         <InputNumber style={{ width: "100%" }} min={0} />
//                     </Form.Item>

//                     <Form.Item name="price_two_year" label="2 years price" rules={[{ required: true }]}>
//                         <InputNumber style={{ width: "100%" }} min={0} />
//                     </Form.Item>
//                 </Form>
//             </Modal>

//         </div>
//     );
// }
























"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Popconfirm,
  Tooltip,
} from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

type PriceObj = {
  base?: number | null;
  discount_price?: number | null;
  discount_percent?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
};

type MagazineRow = {
  id: number;
  magazine_id?: string;
  title: string;
  nav_link?: string;
  year: number | null;
  type: string | null;
  price_one_year: PriceObj | number | null;
  price_two_year: PriceObj | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatPriceCell(v: PriceObj | number | null) {
  if (v == null) return "";
  if (typeof v === "number") return `₹${v}`;
  const base = typeof v.base === "number" ? v.base : null;
  const disc = typeof v.discount_price === "number" ? v.discount_price : null;
  const dp = typeof v.discount_percent === "number" ? v.discount_percent : null;
  const end = v.discount_end_date ? new Date(v.discount_end_date).toLocaleDateString() : null;

  if (disc != null && dp != null) {
    const period = end ? ` — until ${end}` : "";
    return `₹${disc} (${dp}% off${period})`;
  }
  if (base != null) {
    return `₹${base}`;
  }
  return "";
}

export default function Page() {
  const [rows, setRows] = useState<MagazineRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm] = Form.useForm();

  // Edit modal state
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

  const fetchMagazines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/magazines", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || `Fetch failed (${res.status})`);
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      message.error(err?.message || "Failed to load magazines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMagazines();
  }, [fetchMagazines]);

  const openAdd = () => {
    addForm.resetFields();
    setAddOpen(true);
  };

  const submitAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setAdding(true);

      const payload = {
        magazine_id: (values.magazine_id ?? "").trim(),
        title: (values.title ?? "").trim(),
        nav_link: (values.nav_link ?? "").trim(),
        year: values.year ?? null,
        type: (values.type ?? "").trim(),
        price_one_year:
          typeof values.price_one_year === "object"
            ? values.price_one_year
            : { base: values.price_one_year ?? 0 },
        price_two_year:
          typeof values.price_two_year === "object"
            ? values.price_two_year
            : { base: values.price_two_year ?? 0 },
      };

      const res = await fetch("/api/admin/magazines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        console.error("POST /api/admin/magazines failed:", res.status, json);
        if (res.status === 409) throw new Error(json?.error || "Duplicate");
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      message.success("Magazine added");
      setAddOpen(false);
      fetchMagazines();
    } catch (err: any) {
      // form validation errors will be thrown by validateFields() -> they show in form UI
      if (err?.errorFields) {
        message.error("Please fix the highlighted fields.");
      } else {
        console.error("submitAdd error:", err);
        message.error(err?.message || "Failed to add magazine");
      }
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (record: MagazineRow) => {
    setEditId(record.id);
    // Normalize the price fields into numbers (base) for the simple form
    const p1 = typeof record.price_one_year === "number"
      ? record.price_one_year
      : (record.price_one_year && (record.price_one_year as PriceObj).base) ?? 0;
    const p2 = typeof record.price_two_year === "number"
      ? record.price_two_year
      : (record.price_two_year && (record.price_two_year as PriceObj).base) ?? 0;

    editForm.setFieldsValue({
      magazine_id: record.magazine_id ?? "",
      title: record.title ?? "",
      nav_link: record.nav_link ?? "",
      year: record.year ?? null,
      type: record.type ?? "",
      price_one_year: p1,
      price_two_year: p2,
    });

    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editId) throw new Error("Missing edit id");
      setEditSubmitting(true);

      const payload = {
        id: editId,
        magazine_id: (values.magazine_id ?? "").trim(),
        title: (values.title ?? "").trim(),
        nav_link: (values.nav_link ?? "").trim(),
        year: values.year ?? null,
        type: (values.type ?? "").trim(),
        price_one_year:
          typeof values.price_one_year === "object"
            ? values.price_one_year
            : { base: values.price_one_year ?? 0 },
        price_two_year:
          typeof values.price_two_year === "object"
            ? values.price_two_year
            : { base: values.price_two_year ?? 0 },
      };

      const res = await fetch("/api/admin/magazines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) {
        console.error("PUT /api/admin/magazines failed:", res.status, json);
        if (res.status === 409) throw new Error(json?.error || "Duplicate");
        throw new Error(json?.error || `Update failed (${res.status})`);
      }

      message.success("Magazine updated");
      setEditOpen(false);
      setEditId(null);
      editForm.resetFields();
      fetchMagazines();
    } catch (err: any) {
      if (err?.errorFields) {
        message.error("Please fix the highlighted fields.");
      } else {
        console.error("submitEdit error:", err);
        message.error(err?.message || "Failed to update magazine");
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteMagazine = async (id: number) => {
    try {
      const res = await fetch("/api/admin/magazines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Magazine deleted");
      fetchMagazines();
    } catch (err: any) {
      message.error(err?.message || "Failed to delete magazine");
    }
  };

  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
      { title: "Name", dataIndex: "title", key: "title", ...getColumnSearchProps("title") },
      { title: "Year", dataIndex: "year", key: "year", width: 140, ...getColumnSearchProps("year") },
      { title: "Type", dataIndex: "type", key: "type", width: 140, ...getColumnSearchProps("type") },
      {
        title: "1 year price",
        dataIndex: "price_one_year",
        key: "price_one_year",
        width: 150,
        render: (v: PriceObj | number | null) => formatPriceCell(v),
        ...getColumnSearchProps("price_one_year"),
        onFilter: (value: any, record: any) => {
          const formatted = formatPriceCell(record.price_one_year);
          return formatted.toString().toLowerCase().includes(value.toLowerCase());
        },
      },

      {
        title: "2 years price",
        dataIndex: "price_two_year",
        key: "price_two_year",
        width: 150,
        render: (v: PriceObj | number | null) => formatPriceCell(v),
        ...getColumnSearchProps("price_two_year"),
        onFilter: (value: any, record: any) => {
          const formatted = formatPriceCell(record.price_two_year);
          return formatted.toString().toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 110,
        render: (_: any, record: MagazineRow) => (
          <Space size="small">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
                aria-label={`Edit ${record.title}`}
              />
            </Tooltip>

            <Popconfirm
              title={`Delete "${record.title}"?`}
              onConfirm={() => deleteMagazine(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                    danger
                  icon={<DeleteOutlined />}
                  aria-label={`Delete ${record.title}`}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [getColumnSearchProps]
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Magazines</Title>
        <Space>
          <Button type="primary" onClick={openAdd}>Add magazine</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns as any}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Add Modal */}
      <Modal
        open={addOpen}
        title="Add Magazine"
        onCancel={() => setAddOpen(false)}
        onOk={submitAdd}
        confirmLoading={adding}
        destroyOnHidden
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ price_one_year: 0, price_two_year: 0 }}
        >
          <Form.Item
            name="magazine_id"
            label="Magazine ID"
            rules={[{ required: true, message: "Magazine ID is required" }]}
          >
            <Input placeholder="e.g. MAG2024FEB" />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="nav_link"
            label="Navigation Link"
            rules={[{ required: true, message: "Nav link is required" }]}
          >
            <Input placeholder="https://example.com/magazine/issue" />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: "Year is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1900} max={3000} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Input placeholder="e.g. Monthly / Weekly / Annual" />
          </Form.Item>

          <Form.Item name="price_one_year" label="1 year price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="price_two_year" label="2 years price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title="Edit Magazine"
        onCancel={() => { setEditOpen(false); setEditId(null); editForm.resetFields(); }}
        onOk={submitEdit}
        confirmLoading={editSubmitting}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" initialValues={{ price_one_year: 0, price_two_year: 0 }}>
          <Form.Item
            name="magazine_id"
            label="Magazine ID"
            rules={[{ required: true, message: "Magazine ID is required" }]}
          >
            <Input placeholder="e.g. MAG2024FEB" />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="nav_link"
            label="Navigation Link"
            rules={[{ required: true, message: "Nav link is required" }]}
          >
            <Input placeholder="https://example.com/magazine/issue" />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: "Year is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1900} max={3000} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Input placeholder="e.g. Monthly / Weekly / Annual" />
          </Form.Item>

          <Form.Item name="price_one_year" label="1 year price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="price_two_year" label="2 years price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
