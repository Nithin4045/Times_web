// src/app/[locale]/admin/test_area_level/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
} from "antd";
import styles from "./page.module.css";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

type AreaLevelRow = {
  id: number;
  area: string;
  level: string;
  test_type_id: number[];
  created_at?: string;
  updated_at?: string;
};

type TestType = {
  id: number;
  test_name: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [areaLevels, setAreaLevels] = useState<AreaLevelRow[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);

  // add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AreaLevelRow | null>(null);
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

  const fetchAreaLevels = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await fetch("/api/admin/tests_area_level", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Failed (${res.status})`);
      setAreaLevels(Array.isArray(json.data) ? json.data : []);
      setTestTypes(Array.isArray(json.lookups?.test_types) ? json.lookups.test_types : []);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to fetch area levels");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreaLevels();
  }, []); // eslint-disable-line

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (rec: AreaLevelRow) => {
    setEditing(rec);
    form.setFieldsValue({
      id: rec.id,
      area: rec.area,
      level: rec.level,
      test_type_id: rec.test_type_id,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const vals = await form.validateFields();
      const payload: any = {
        area: vals.area?.trim(),
        level: vals.level?.trim(),
        test_type_id: vals.test_type_id ?? [],
      };

      if (editing) {
        payload.id = editing.id;
        const res = await fetch("/api/admin/tests_area_level", {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Update failed (${res.status})`);
        message.success("Test area level updated");
      } else {
        // For add, use the existing POST logic with selected_ids
        const res = await fetch("/api/admin/tests_area_level", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            area: vals.area?.trim(),
            level: vals.level?.trim(),
            selected_ids: vals.test_type_id ?? [],
            new_names: []
          }),
        });
        const j = await res.json().catch(()=>({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || `Create failed (${res.status})`);
        message.success("Test area level created");
      }
      setModalOpen(false);
      fetchAreaLevels();
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tests_area_level?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success !== true) throw new Error(json?.error || `Delete failed (${res.status})`);
      message.success("Test area level deleted");
      fetchAreaLevels();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  // Create a map for test type lookup
  const testTypeMap = new Map(testTypes.map(tt => [tt.id, tt.test_name]));

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, ...getColumnSearchProps("id") },
    { title: "Area", dataIndex: "area", key: "area", width: 200, ...getColumnSearchProps("area") },
    { title: "Level", dataIndex: "level", key: "level", width: 200, ...getColumnSearchProps("level") },
    {
      title: "Test Types",
      dataIndex: "test_type_id",
      key: "test_type_id",
      width: 400,
      render: (arr: number[]) => {
        if (!arr || arr.length === 0) return "-";
        return (
          <Space wrap>
            {arr.map((id) => (
              <Tag key={id} color="blue">
                {testTypeMap.get(id) || `ID: ${id}`}
              </Tag>
            ))}
          </Space>
        );
      },
      ...getColumnSearchProps("test_type_id"),
      onFilter: (value: any, record: any) => {
        const types = record.test_type_id?.map((id: number) => testTypeMap.get(id) || "").join(" ") || "";
        return types.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: any, rec: AreaLevelRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm 
            title="Delete test area level?" 
            description="This may affect existing tests linked to this area/level."
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
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Test Area & Level</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Area Level</Button>
        </Space>
      </div>

      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          dataSource={areaLevels}
          columns={columns}
          loading={listLoading || loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1200 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Test Area Level" : "Add Test Area Level"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input/></Form.Item>

          <Form.Item name="area" label="Area" rules={[{ required: true, message: "Enter area" }]}>
            <Input placeholder="e.g., Verbal, Quantitative, Logical Reasoning" />
          </Form.Item>

          <Form.Item name="level" label="Level" rules={[{ required: true, message: "Enter level" }]}>
            <Input placeholder="e.g., Foundation, Intermediate, Advanced" />
          </Form.Item>

          <Form.Item 
            name="test_type_id" 
            label="Test Types"
            rules={[{ required: true, message: "Select at least one test type" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select test types"
              showSearch
              optionFilterProp="children"
            >
              {testTypes.map((tt) => (
                <Select.Option key={tt.id} value={tt.id}>
                  {tt.test_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

