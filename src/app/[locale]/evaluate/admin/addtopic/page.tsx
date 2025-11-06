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
  Upload
} from "antd";

import { SearchOutlined, DownloadOutlined, EditOutlined, EyeOutlined, PlusCircleFilled, PlusSquareFilled, PlusSquareOutlined, UploadOutlined } from "@ant-design/icons";

import styles from "@/app/[locale]/evaluate/admin/addtopic/addtopic.module.css";
import { AnyAaaaRecord } from "dns";
import "@/app/global.css"
import * as XLSX from "xlsx";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

interface Test {
  topic_description: string;
  topic_code: string;
  require_resource: number;
  test_type: string;
  topic_id: number;
  id: number;
}

const AddTopic = () => {
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
      const response = await fetch("/api/evaluate/Admin/addtopic");
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
        topic_description: values.topic_description,
        topic_code: values.topic_code,
        require_resource: parseInt(values.require_resource),
        test_type: values.test_type
      };
      const url = editingTest
        ? `/api/evaluate/Admin/addtopic/${editingTest.topic_id}`
        : "/api/evaluate/Admin/addtopic";

      const method = editingTest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        message.success(editingTest ? "Test updated successfully" : "Test added successfully");
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
    console.log(record, 'recordrecord')
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      topic_description: record.topic_description,
      topic_code: record.topic_code,
      require_resource: record.require_resource,
      test_type: record.test_type,
    });
  };

  const handleView = (record: Test) => {
    setIsViewMode(true);
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      topic_description: record.topic_description,
      topic_code: record.topic_code,
      require_resource: record.require_resource,
      test_type: record.test_type
    });
  };

  const columns: ColumnType<Test>[] = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Test) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },

    {
      title: "Topic Name",
      dataIndex: "topic_description",
      key: "topic_description",
      sorter: (a: any, b: any) => {
        const valA = a.topic_description ?? "";
        const valB = b.topic_description ?? "";
        return String(valA).localeCompare(String(valB));
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search Topic Description`}
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
            }}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="link" onClick={() => clearFilters && clearFilters()}>Reset</Button>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>Search</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: string | number | boolean | bigint, record: Test) => {
        const recordValue = record.topic_description ?? "";
        return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Topic Code",
      dataIndex: "topic_code",
      key: "topic_code",
      sorter: (a: any, b: any) => {
        const valA = a.topic_code ?? "";
        const valB = b.topic_code ?? "";
        return String(valA).localeCompare(String(valB));
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search Topic Code`}
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
            }}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="link" onClick={() => clearFilters && clearFilters()}>Reset</Button>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>Search</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: string | number | boolean | bigint, record: Test) => {
        const recordValue = record.topic_code ?? "";
        return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Require Resource",
      dataIndex: "require_resource",
      key: "require_resource",
      render: (value: any) => (value === 1 ? "Yes" : "No"),
      sorter: (a: any, b: any) => a.require_resource - b.require_resource,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search Require Resource`}
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
            }}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="link" onClick={() => clearFilters && clearFilters()}>Reset</Button>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>Search</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: string | number | boolean | bigint, record: Test) => {
        const recordValue = record.require_resource === 1 ? "Yes" : "No";
        return recordValue.toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Test Type",
      dataIndex: "test_type",
      key: "test_type",
      sorter: (a: any, b: any) => {
        const valA = a.test_type ?? "";
        const valB = b.test_type ?? "";
        return String(valA).localeCompare(String(valB));
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search Test Type`}
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
            }}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="link" onClick={() => clearFilters && clearFilters()}>Reset</Button>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />}>Search</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: string | number | boolean | bigint, record: Test) => {
        const recordValue = record.test_type ?? "";
        return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
      },
    },
  ];

  const handleExcelUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        if (data instanceof ArrayBuffer) {
          const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and format the data
          const validRecords = jsonData.map((record: any) => ({
            topic_code: record.topic_code?.toString() || record.TOPIC_CODE?.toString(),
            topic_description: record.topic_description?.toString() || record.TOPIC_DESCRIPTION?.toString(),
            require_resource: (record.require_resource?.toString() === "Yes" || record.REQUIRE_RESOURCE?.toString() === "Yes") ? 1 : 0,
            test_type: record.test_type?.toString() || record.TEST_TYPE?.toString(),
          }));

          // Send to backend
          const response = await fetch("/api/evaluate/Admin/addtopic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records: validRecords }),
          });

          if (response.ok) {
            message.success("Records uploaded successfully");
            fetchData();
          } else if (response.status == 409) {
            const data = await response.json();
            alert(data.message)
            message.error(data.message || "Some topic codes already exist");
          } else {
            const data = await response.json().catch(() => ({}));
            message.error(data.message || "Failed to upload records");
          }
        }
      };
      reader.readAsArrayBuffer(file);
      return false;
    } catch (error) {
      message.error("Error uploading Excel file");
      return false;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.ContentCompilerHeader}>
        <div >
          <div className="MainTitle">TOPICS</div>
        </div>
        <div>
          <a href="\uploads\evaluate\topic_template.xlsx" download>
            <Button icon={<DownloadOutlined />} className="generatebutton" type="primary">
              Download Template
            </Button>
          </a>
          <Upload
            accept=".xls,.xlsx"
            showUploadList={false}
            beforeUpload={handleExcelUpload}
          >
            <Button icon={<UploadOutlined />} type="primary"
              className="generatebutton">Upload Excel</Button>
          </Upload>
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
            Add Topic
          </Button>
        </div>
      </div>
      <Table 
        dataSource={data} 
        columns={columns} 
        loading={loading} 
        className={styles.tableData}
        rowKey="topic_id" 
      />

      <Modal
        title={isViewMode ? "View Topic" : editingTest ? "Edit Topic" : "Add New Topic"}
        open={isTestModalOpen}
        onCancel={() => setIsTestModalOpen(false)}
        footer={
          !isViewMode && [
            <Button key="cancel" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" htmlType="submit" onClick={() => form.submit()}>
              {editingTest ? "Update" : "Submit"}
            </Button>,
          ]
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrEditTest}>
          
          <Form.Item
            name="topic_description"
            label="Topic Name"
            rules={[{ required: true, message: "Enter topic description" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="topic_code"
            label="Topic Code"
            rules={[{ required: true, message: "Please enter topic code" },
            {
              validator: async (_, value) => {
                // If editingTest is set, skip validation
                if (editingTest) {
                  return Promise.resolve();
                }

                if (!value) return Promise.resolve();

                const response = await fetch(`/api/evaluate/Admin/addtopic?code=${value}`);
                const data = await response.json();

                if (data.exists) {
                  return Promise.reject("Topic Code already exists!");
                }

                return Promise.resolve();
              }
            }
            ]}
          >
            <Input disabled={isViewMode || editingTest !== null} />
          </Form.Item>
          <Form.Item
            name="require_resource"
            label="Require Resource"
            rules={[{ required: false, message: "Please select resource requirement" }]}
          >
            <Select disabled={isViewMode}>
              <Option value={1}>Yes</Option>
              <Option value={0}>No</Option>
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

export default AddTopic;