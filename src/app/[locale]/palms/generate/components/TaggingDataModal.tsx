import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Form, Input, Space, message, Popconfirm, Checkbox } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { FilterConfirmProps } from 'antd/es/table/interface';
import styles from "./TaggingDataModal.module.css";

interface TaggingData {
  id: number;
  area: string | null;
  sub_area: string | null;
  topic: string | null;
  sub_topic: string | null;
  description?: string | null;
  deleted: number;
  user_id: number | null;
  created_at: Date;
  updated_at: Date | null;
}

interface TaggingDataModalProps {
  open: boolean;
  onCancel: () => void;
  onStartTagging: (selectedCategories: TaggingData[]) => void;
}

export default function TaggingDataModal({ open, onCancel, onStartTagging }: TaggingDataModalProps) {
  const [taggingData, setTaggingData] = useState<TaggingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (open) {
      fetchTaggingData();
    }
  }, [open]);

  const fetchTaggingData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/palms/tagging_data");
      const data = await response.json();

      if (data.success) {
        setTaggingData(data.data);
      } else {
        message.error("Failed to load tagging data");
      }
    } catch (error) {
      console.error("Error fetching tagging data:", error);
      message.error("Error loading tagging data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddingNew(true);
    form.resetFields();
  };

  const handleEdit = (record: TaggingData) => {
    setEditingId(record.id);
    form.setFieldsValue({
      area: record.area,
      sub_area: record.sub_area,
      topic: record.topic,
      sub_topic: record.sub_topic,
      description: record.description,
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (isAddingNew) {
        // Create new entry
        const response = await fetch("/api/palms/tagging_data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (data.success) {
          message.success("Tagging data added successfully");
          setIsAddingNew(false);
          form.resetFields();
          fetchTaggingData();
        } else {
          message.error(data.error || "Failed to add tagging data");
        }
      } else if (editingId !== null) {
        // Update existing entry
        const response = await fetch("/api/palms/tagging_data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            ...values,
          }),
        });

        const data = await response.json();

        if (data.success) {
          message.success("Tagging data updated successfully");
          setEditingId(null);
          form.resetFields();
          fetchTaggingData();
        } else {
          message.error(data.error || "Failed to update tagging data");
        }
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/palms/tagging_data?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        message.success("Tagging data deleted successfully");
        fetchTaggingData();
      } else {
        message.error(data.error || "Failed to delete tagging data");
      }
    } catch (error) {
      console.error("Error deleting tagging data:", error);
      message.error("Error deleting tagging data");
    }
  };

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record: TaggingData) => ({
      disabled: editingId === record.id || isAddingNew,
    }),
  };

  // Search filter function
  const getColumnSearchProps = (dataIndex: keyof TaggingData) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
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
          <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: TaggingData) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(String(value).toLowerCase()) || false,
  });

  const columns: ColumnsType<TaggingData> = [
    {
      title: "S.No",
      key: "index",
      width: 70,
      align: "center",
      render: (_: any, __: TaggingData, index: number) => {
        // Calculate continuous S.No across pages
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      width: 150,
      sorter: (a, b) => (a.area || "").localeCompare(b.area || ""),
      ...getColumnSearchProps('area'),
      render: (text: string | null, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Form.Item name="area" noStyle rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Area" />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: "Sub Area",
      dataIndex: "sub_area",
      key: "sub_area",
      width: 150,
      sorter: (a, b) => (a.sub_area || "").localeCompare(b.sub_area || ""),
      ...getColumnSearchProps('sub_area'),
      render: (text: string | null, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Form.Item name="sub_area" noStyle rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Sub Area" />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      width: 150,
      sorter: (a, b) => (a.topic || "").localeCompare(b.topic || ""),
      ...getColumnSearchProps('topic'),
      render: (text: string | null, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Form.Item name="topic" noStyle rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Topic" />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: "Sub Topic",
      dataIndex: "sub_topic",
      key: "sub_topic",
      width: 150,
      sorter: (a, b) => (a.sub_topic || "").localeCompare(b.sub_topic || ""),
      ...getColumnSearchProps('sub_topic'),
      render: (text: string | null, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Form.Item name="sub_topic" noStyle rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Sub Topic" />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 300,
      ...getColumnSearchProps('description'),
      render: (text: string | null, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Form.Item name="description" noStyle>
              <Input placeholder="Short description or keywords" />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      fixed: 'right' as const,
      render: (_: any, record: TaggingData) => {
        if (editingId === record.id) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this entry?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Manage Tagging Data</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#1890ff' }}>
              {selectedRowKeys.length} categories selected for tagging
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
        <Button 
          key="start" 
          type="primary" 
          onClick={() => {
            const selectedCategories = taggingData.filter(item => selectedRowKeys.includes(item.id));
            onStartTagging(selectedCategories);
          }}
          disabled={selectedRowKeys.length === 0}
        >
          Start Tagging ({selectedRowKeys.length} selected)
        </Button>,
      ]}
      centered
      className={styles.taggingModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.toolbar}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={isAddingNew || editingId !== null}
          >
            Add New Entry
          </Button>
          <div className={styles.dataCount}>
            Total Entries: <strong>{taggingData.length}</strong>
            {selectedRowKeys.length > 0 && (
              <span style={{ marginLeft: '16px', color: '#1890ff', fontWeight: 600 }}>
                Selected: {selectedRowKeys.length}
              </span>
            )}
          </div>
        </div>

        {isAddingNew && (
          <div className={styles.addNewForm}>
            <Form form={form} layout="inline">
              <Form.Item name="area" rules={[{ required: true, message: "Area is required" }]}>
                <Input placeholder="Area" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="sub_area" rules={[{ required: true, message: "Sub Area is required" }]}>
                <Input placeholder="Sub Area" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="topic" rules={[{ required: true, message: "Topic is required" }]}>
                <Input placeholder="Topic" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="sub_topic" rules={[{ required: true, message: "Sub Topic is required" }]}>
                <Input placeholder="Sub Topic" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="description">
                <Input placeholder="Description / examples / keywords" style={{ width: 260 }} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                    Save
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancel}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        <Form form={form} component={false}>
          <Table
            columns={columns}
            dataSource={taggingData}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
            scroll={{ x: 900, y: 400 }}
            bordered
            className={styles.taggingTable}
          />
        </Form>
      </div>
    </Modal>
  );
}

