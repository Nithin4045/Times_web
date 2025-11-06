
// "use client";

// import { useEffect, useState } from "react";
// import {
//   Button,
//   Input,
//   Modal,
//   Form,
//   DatePicker,
//   Space,
//   message,
//   Table,
// } from "antd";
// import dayjs from "dayjs";
// import styles from "@/assets/styles/evaluate/add_test.module.css"; 

// const AddTest = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch("/api/evaluate/Admin/addtests");
//       const result = await response.json();
//       setData(result.tests || []);
//     } catch (error) {
//       message.error("Failed to load tests");
//     }
//     setLoading(false);
//   };

//   const handleAddTest = async (values: any) => {
//     try {
//       const response = await fetch("/api/evaluate/Admin/addtests", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           test_name: values.test_title,
//           validity_start: values.validity_start.format("YYYY-MM-DD HH:mm:ss"),
//           validity_end: values.validity_end.format("YYYY-MM-DD HH:mm:ss"),
//           general_data: values.general_data,
//           master_data: values.master_data,
//           video: values.video,
//         }),
//       });

//       if (response.ok) {
//         message.success("Test added successfully");
//         setIsModalOpen(false);
//         form.resetFields();
//         fetchData();
//       } else {
//         message.error("Failed to add test");
//       }
//     } catch (error) {
//       message.error("Something went wrong");
//     }
//   };

//   const columns = [
//     { title: "Test ID", dataIndex: "TEST_ID", key: "TEST_ID" },
//     { title: "Test Name", dataIndex: "TEST_DESCRIPTION", key: "TEST_DESCRIPTION" },
//     { title: "Validity Start", dataIndex: "VALIDITY_START", key: "VALIDITY_START" },
//     { title: "Validity End", dataIndex: "VALIDITY_END", key: "VALIDITY_END" },
//   ];

//   return (
//     <div className={styles.container}>
//       <Space className={styles.buttonContainer} align="center">
//         <Button type="primary" onClick={() => setIsModalOpen(true)}>
//           Add Test
//         </Button>
//       </Space>

//       <Table dataSource={data} columns={columns} loading={loading} rowKey="TEST_ID" />

//       <Modal
//         title="Add New Test"
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         footer={null}
//       >
//         <Form form={form} layout="vertical" onFinish={handleAddTest}>
//           <Form.Item
//             name="test_title"
//             label="Test Name"
//             rules={[{ required: true, message: "Please enter test name" }]}
//           >
//             <Input placeholder="Enter test name" />
//           </Form.Item>

//           <Form.Item
//             name="validity_start"
//             label="Validity Start"
//             rules={[{ required: true, message: "Select start date" }]}
//           >
//             <DatePicker showTime />
//           </Form.Item>

//           <Form.Item
//             name="validity_end"
//             label="Validity End"
//             rules={[{ required: true, message: "Select end date" }]}
//           >
//             <DatePicker showTime />
//           </Form.Item>

//           <Button type="primary" htmlType="submit">
//             Submit
//           </Button>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default AddTest;

















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
import dayjs from "dayjs";
import styles from "@/assets/styles/evaluate/addTest.module.css";
import AssignSection from "./assignSection";

const { Option } = Select;

interface Test {
  TEST_ID: number;
  TEST_DESCRIPTION: string;
  TEST_TYPE: string;
  VALIDITY_START: string;
  VALIDITY_END: string;
  COLLEGE_CODE: string;
  COLLEGE_NAME: string;
}

const AddTest = () => {
  const [data, setData] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [form] = Form.useForm();
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [isaddsecModalOpen, setIsaddsecModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
  const handleOpenModal = (testId: number) => {
    setSelectedTestId(testId);
    setIsaddsecModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsaddsecModalOpen(false);
    setSelectedTestId(null);
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluate/Admin/addtests");
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
        test_name: values.test_title,
        test_type: values.test_type,
        validity_start: values.validity_start.format("YYYY-MM-DD HH:mm:ss"),
        validity_end: values.validity_end.format("YYYY-MM-DD HH:mm:ss"),
        college_code: values.college_code,
        college_name: values.college_name,
      };

      const url = editingTest
        ? `/api/evaluate/Admin/addtests/${editingTest.TEST_ID}`
        : "/api/evaluate/Admin/addtests";

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
      test_title: record.TEST_DESCRIPTION,
      test_type: record.TEST_TYPE,
      validity_start: dayjs(record.VALIDITY_START),
      validity_end: dayjs(record.VALIDITY_END),
      college_code: record.COLLEGE_CODE,
      college_name: record.COLLEGE_NAME,
    });
  };

  const handleView = (record: Test) => {
    setIsViewMode(true);
    setEditingTest(record);
    setIsTestModalOpen(true);
    form.setFieldsValue({
      test_title: record.TEST_DESCRIPTION,
      test_type: record.TEST_TYPE,
      validity_start: dayjs(record.VALIDITY_START),
      validity_end: dayjs(record.VALIDITY_END),
      college_code: record.COLLEGE_CODE,
      college_name: record.COLLEGE_NAME,
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
         
          <Button icon={<PlusOutlined />} onClick={() => handleOpenModal(record.TEST_ID)} />
      
        </Space>
      ),
    },
    { title: "Test Name", dataIndex: "TEST_DESCRIPTION", key: "TEST_DESCRIPTION" },
    { title: "Test Type", dataIndex: "TEST_TYPE", key: "TEST_TYPE" },
    { title: "Validity Start", dataIndex: "VALIDITY_START", key: "VALIDITY_START" },
    { title: "Validity End", dataIndex: "VALIDITY_END", key: "VALIDITY_END" },
    { title: "College Code", dataIndex: "COLLEGE_CODE", key: "COLLEGE_CODE" },
    { title: "College Name", dataIndex: "COLLEGE_NAME", key: "COLLEGE_NAME" },
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
          Add Test
        </Button>
      </Space>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="TEST_ID" />
      <Modal
        title="Select Subjects"
        open={isaddsecModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width="100vw"
        height="100vh"
      >

        {selectedTestId && <AssignSection testId={selectedTestId} />}
      </Modal>

      <Modal
        title={isViewMode ? "View Test" : editingTest ? "Edit Test" : "Add New Test"}
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
            name="test_title"
            label="Test Name"
            rules={[{ required: true, message: "Please enter test name" }]}
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

          <Form.Item
            name="validity_start"
            label="Validity Start"
            rules={[{ required: true, message: "Select start date" }]}
          >
            <DatePicker showTime disabled={isViewMode} />
          </Form.Item>

          <Form.Item
            name="validity_end"
            label="Validity End"
            rules={[{ required: true, message: "Select end date" }]}
          >
            <DatePicker showTime disabled={isViewMode} />
          </Form.Item>

          <Form.Item
            name="college_code"
            label="College Code"
            rules={[{ required: true, message: "Enter college code" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>

          <Form.Item
            name="college_name"
            label="College Name"
            rules={[{ required: true, message: "Enter college name" }]}
          >
            <Input disabled={isViewMode} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTest;
