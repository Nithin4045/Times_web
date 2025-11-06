"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Form,
  DatePicker,
  Space,
  message,
  Table,
  Select,
} from "antd";


import styles from "@/app/[locale]/evaluate/admin/addtopic/addtopic.module.css";
import { AnyAaaaRecord } from "dns";
import "@/app/global.css";

import { EyeOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

interface Test {
  subject_id: number;
  subject_description: string;
  subject_code: string;
  test_type: string;
  REQUIRE_RESOURCE: number;
}

const AddSection = () => {
  const [data, setData] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluate/Admin/addsection");
      const result: { tests: Test[] } = await response.json();
      setData(result.tests || []);
    } catch (error) {
      message.error("Failed to load tests");
    }
    setLoading(false);
  };

  const handleAddOrEditTest = async (values: any) => {
    try {
      const requestBody = {
        subject_description: values.subject_description,
        test_type: values.test_type,
        subject_code: values.subject_code,
        REQUIRE_RESOURCE: values.REQUIRE_RESOURCE,
      };

      const url = editingTest
        ? `/api/evaluate/Admin/addsection/${editingTest.subject_id}`
        : "/api/evaluate/Admin/addsection";

      const method = editingTest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        message.success(
          editingTest ? "Test updated successfully" : "Test added successfully"
        );
        setIsTestModalOpen(false);
        form.resetFields();
        fetchData();
        setEditingTest(null);
      } else {
        message.error("Failed to save test");
      }
    } catch (error) {
      message.error("Something went wrong");
    }
  };

  const handleEdit = (record: Test) => {
    setIsViewMode(false);
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      subject_description: record.subject_description,
      test_type: record.test_type,
      subject_code: record.subject_code,
      REQUIRE_RESOURCE: record.REQUIRE_RESOURCE,
    });
  };

  const handleView = (record: Test) => {
    setIsViewMode(true);
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      subject_description: record.subject_description,
      test_type: record.test_type,
      subject_code: record.subject_code,
      REQUIRE_RESOURCE: record.REQUIRE_RESOURCE,
    });
  };
  

const getColumnSearchProps = (
  dataIndex: keyof Test,
  placeholder: string
): ColumnType<Test> => ({
  sorter: (a, b) => {
    const valA = a[dataIndex] ?? "";
    const valB = b[dataIndex] ?? "";
    return String(valA).localeCompare(String(valB));
  },
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Search ${placeholder}`}
        value={selectedKeys[0]}
        onChange={(e) => {
          setSelectedKeys(e.target.value ? [e.target.value] : []);
        }}
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: "block" }}
      />
      <Space>
        <Button onClick={() => clearFilters?.()} type="link">Reset</Button>
        <Button onClick={() => confirm()} type="primary" icon={<SearchOutlined />}>
          Search
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
  ),
  onFilter: (value: string | number | boolean | bigint, record: Test) =>
    String(record[dataIndex] ?? "")
      .toLowerCase()
      .includes(String(value).toLowerCase()),
});

const columns: ColumnType<Test>[] = [
  {
    title: "Actions",
    key: "actions",
    render: (_: any, record: Test) => (
      <>
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
      </>
    ),
  },
  {
    title: "Subject Name",
    dataIndex: "subject_description",
    key: "subject_description",
    ...getColumnSearchProps("subject_description", "Subject Description"),
  },
  {
    title: "Subject Code",
    dataIndex: "subject_code",
    key: "subject_code",
    ...getColumnSearchProps("subject_code", "Subject Code"),
  },
  
  {
    title: "Require Resource",
   dataIndex: "require_resource", // ✅ lowercase
  key: "require_resource",
    render: (value: any) => (value === 1 ? "Yes" : "No"),
    sorter: (a, b) => Number(a.REQUIRE_RESOURCE) - Number(b.REQUIRE_RESOURCE),
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Yes / No`}
          value={selectedKeys[0]}
          onChange={(e) => {
            setSelectedKeys(e.target.value ? [e.target.value] : []);
          }}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button onClick={() => clearFilters?.()} type="link">Reset</Button>
          <Button onClick={() => confirm()} type="primary" icon={<SearchOutlined />}>
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value: string | number | boolean | bigint, record: Test) => {
      const displayValue = record.REQUIRE_RESOURCE === 1 ? "Yes" : "No";
      return displayValue.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    title: "Test Type",
    dataIndex: "test_type",
    key: "test_type",
    ...getColumnSearchProps("test_type", "Test Type"),
  },
];


  // const columns = [
  //   {
  //     title: "Actions",
  //     key: "actions",
  //     render: (_: any, record: Test) => (
  //       <>
  //         <Button
  //           type="link"
  //           icon={<EyeOutlined />}
  //           onClick={() => handleView(record)}
  //         />
  //         <Button
  //           type="link"
  //           icon={<EditOutlined />}
  //           onClick={() => handleEdit(record)}
  //         />
  //       </>
  //     ),
  //   },
  //   {
  //     title: "Subject Description",
  //     dataIndex: "subject_description",
  //     key: "subject_description",
  //   },
  //   { title: "Subject Code", dataIndex: "subject_code", key: "subject_code" },
  //   { title: "Test Type", dataIndex: "test_type", key: "test_type" },
  //   {
  //     title: "Require Resource",
  //     dataIndex: "REQUIRE_RESOURCE",
  //     key: "REQUIRE_RESOURCE",
  //     render: (value: any) => (value === 1 ? "Yes" : "No"),
  //   },
  // ];

  return (
    <div className={styles.container}>
      <div className={styles.ContentCompilerHeader}>
        <div>
          <div className="MainTitle">SUBJECTS</div>
        </div>
        <div>
          <Button
            type="primary"
            onClick={() => {
              setIsTestModalOpen(true);
              setIsViewMode(false);
              setEditingTest(null);
              form.resetFields();
            }}
            className="generatebutton"
          >
            Add Subject
          </Button>
        </div>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        className={styles.tableData}
        rowKey="subject_id"
      />

      <Modal
        title={
          isViewMode
            ? "View Subject"
            : editingTest
            ? "Edit Subject"
            : "Add New Subject"
        }
        open={isTestModalOpen}
        onCancel={() => setIsTestModalOpen(false)}
        footer={
          !isViewMode && [
            <Button key="cancel" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              htmlType="submit"
              onClick={() => form.submit()}
            >
              {editingTest ? "Update" : "Submit"}
            </Button>,
          ]
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrEditTest}>
          <Form.Item
            name="subject_description"
            label="Subject Name"
            rules={[{ required: true, message: "Please enter subject name" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="subject_code"
            label="Subject Code"
            rules={[
              { required: true, message: "Enter subject code" },
              {
                validator: async (_, value) => {
                  // If editingTest is set, skip validation
                  if (editingTest) {
                    return Promise.resolve();
                  }

                  if (!value) return Promise.resolve();

                  const response = await fetch(
                    `/api/evaluate/Admin/addsection?code=${value}`
                  );
                  const data = await response.json();

                  if (data.exists) {
                    return Promise.reject("Subject code already exists!");
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input disabled={isViewMode || editingTest !== null} />
          </Form.Item>
          <Form.Item
            name="REQUIRE_RESOURCE"
            label="Require Resource"
            rules={[
              { required: false, message: "Please select resource required?" },
            ]}
          >
            <Select disabled={isViewMode}>
              <Option value="0">No</Option>
              <Option value="1">Yes</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="test_type"
            label="Test Type"
            rules={[{ required: false, message: "Please select test type" }]}
          >
            <Select disabled={isViewMode}>
              <Option value="Practice">PRACTICE</Option>
              <Option value="Exam">EXAM</Option>
              <Option value="Form">Form</Option>
              <Option value="EQ">EQ</Option>
              <Option value="Code">Code</Option>
              <Option value="Video">Video</Option>
            </Select>
          </Form.Item>
          
        </Form>
      </Modal>
    </div>
  );
};

export default AddSection;
