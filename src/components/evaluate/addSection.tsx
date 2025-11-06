

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
  Select
} from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";

import styles from "@/assets/styles/evaluate/addTest.module.css";


const { Option } = Select;

interface Test {
  subject_id: number;
  subject_description: string;
  subject_code: string;
  test_type:string;
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
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      subject_description: record.subject_description,
      test_type: record.test_type,
      subject_code: record.subject_code,
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
      
    });
  };

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Test) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
    { title: "Subject Description", dataIndex: "subject_description", key: "subject_description" },
    { title: "Subject Code", dataIndex: "subject_code", key: "subject_code" },
    { title: "Test Type", dataIndex: "test_type", key: "test_type" },
  ];

  return (
    <div className={styles.container}>
      <Space className={styles.buttonContainer} align="center">
        <Button
          type="primary"
          onClick={() => {
            setIsTestModalOpen(true);
            setIsViewMode(false);
            setEditingTest(null);
          }}
        >
          Add Section 
        </Button>
      </Space>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="subject_id" />
      

      <Modal
        title={isViewMode ? "View Section" : editingTest ? "Edit Section" : "Add New Section"}
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
            name="subject_description"
            label="Subject Name"
            rules={[{ required: true, message: "Please enter subject name" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="subject_code"
            label="Subject Code"
            rules={[{ required: true, message: "Enter subject code" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="test_type"
            label="Test Type"
            rules={[{ required: true, message: "Please select test type" }]}
          >
            <Select disabled={isViewMode}>
              <Option value="PRACTICE">PRACTICE</Option>
              <Option value="EXAM">EXAM</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddSection;
