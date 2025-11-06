

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
  TOPIC_DESCRIPTION: string;
  TOPIC_ID:string;
  REQUIRE_RESOURCE: number;
  ID:number;
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
        TOPIC_DESCRIPTION: values.TOPIC_DESCRIPTION,
        TOPIC_ID: values.TOPIC_ID,
        REQUIRE_RESOURCE: values.REQUIRE_RESOURCE,
      };

      const url = editingTest
        ? `/api/evaluate/Admin/addtopic/${editingTest.ID}`
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
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
        TOPIC_DESCRIPTION: record.TOPIC_DESCRIPTION,
      TOPIC_ID: record.TOPIC_ID,
      REQUIRE_RESOURCE: record.REQUIRE_RESOURCE,
    });
  };

  const handleView = (record: Test) => {
    setIsViewMode(true);
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
        TOPIC_DESCRIPTION: record.TOPIC_DESCRIPTION,
      TOPIC_ID: record.TOPIC_ID,
      REQUIRE_RESOURCE: record.REQUIRE_RESOURCE,
      
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
    
    { title: "Topic Name", dataIndex: "TOPIC_ID", key: "TOPIC_ID" },
    { title: "Topic Description", dataIndex: "TOPIC_DESCRIPTION", key: "TOPIC_DESCRIPTION" },
    // { title: "Require Resource", dataIndex: "REQUIRE_RESOURCE", key: "REQUIRE_RESOURCE" },
    {
        title: "Require Resource",
        dataIndex: "REQUIRE_RESOURCE",
        key: "REQUIRE_RESOURCE",
        render: (value:any) => (value == 1 ? "Yes" : "No"),
      }
      
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
          Add Topic 
        </Button>
      </Space>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="subject_id" />
      

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
            name="TOPIC_ID"
            label="Topic Name"
            rules={[{ required: true, message: "Please enter subject name" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="TOPIC_DESCRIPTION"
            label="Topic Description"
            rules={[{ required: true, message: "Enter subject code" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
          <Form.Item
            name="REQUIRE_RESOURCE"
            label="Require Resource"
            rules={[{ required: true, message: "Please select test type" }]}
          >
            <Select disabled={isViewMode}>
              <Option value='1'>YES</Option>
              <Option value='0'>NO</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTopic;
