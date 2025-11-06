"use client";

import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Table, DatePicker, Space, message } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import styles from './addUser_Tests.module.css';

const ManageTestRepositoryPage = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<{
    questionSelectionMethods: string[];
    generalData: string[];
    masterData: string[];
    epiQuestions: string[];
  }>({
    questionSelectionMethods: [],
    generalData: [],
    masterData: [],
    epiQuestions: [],
  });
  const [isOther, setIsOther] = useState<{
    generalData: boolean;
    masterData: boolean;
    epiQuestion: boolean;
  }>({
    generalData: false,
    masterData: false,
    epiQuestion: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/evaluate/Admin/addtests");
      setData(res.data);
      const { questionSelectionMethods, generalData, masterData, epiQuestions } = res.data.dropdownOptions;
      setDropdownOptions({
        questionSelectionMethods,
        generalData,
        masterData,
        epiQuestions,
      });
    } catch (error) {
      message.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (values: any) => {
    try {
      await axios.post("/api/evaluate/Admin/addtests", values);
      message.success("Test added successfully!");
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error("Failed to add test.");
    }
  };

  const handleOtherChange = (field: keyof typeof dropdownOptions, value: string) => {
    setIsOther((prev) => ({ ...prev, [field]: value === "Other" }));
  };

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button>Edit</Button>
          <Button>Delete</Button>
          <Button>View</Button>
        </Space>
      ),
    },
    {
      title: "Test ID",
      dataIndex: "TEST_ID",
      key: "TEST_ID",
    },
    {
      title: "Test Description",
      dataIndex: "TEST_DESCRIPTION",
      key: "TEST_DESCRIPTION",
    },
    {
      title: "Validity Start",
      dataIndex: "VALIDITY_START",
      key: "VALIDITY_START",
    },
    {
      title: "Validity End",
      dataIndex: "VALIDITY_END",
      key: "VALIDITY_END",
    },
    {
      title: "General Data",
      dataIndex: "general_data",
      key: "generalData",
      render: (text: number) => (text === null ? "No": "Yes" ),
    },
    {
      title: "Master Data",
      dataIndex: "master_data",
      key: "masterData",
      render: (text: number) => (text === null ? "No": "Yes" ),
    },
    {
      title: "EPI Questions",
      dataIndex: "epi_question",
      key: "epiQuestions",
      render: (text: number) => (text === null ? "No": "Yes" ),
    },
    {
      title: "Video",
      dataIndex: "video",
      key: "video",
      render: (text: number) => (text === 1 ? "Yes" : "No"),
    },
    
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // return (
  //   <div>
  //     <div className="flex justify-between items-center mb-4">
  //       <h2 className="text-lg font-bold uppercase">Manage Test Repository</h2>
  //       <Button type="primary" onClick={() => setIsModalOpen(true)}>
  //         Add Test
  //       </Button>
  //     </div>
  //     <Table columns={columns} dataSource={data} loading={loading} rowKey="testId" />
  //     <Modal
  //       title="Add Test"
  //       open={isModalOpen}
  //       onCancel={() => setIsModalOpen(false)}
  //       onOk={() => form.submit()}
  //     >
  //       <Form form={form} onFinish={handleAddTest} layout="vertical">
  //         <Form.Item name="testDescription" label="Test Description" rules={[{ required: true }]}>
  //           <Input />
  //         </Form.Item>
  //         <Form.Item name="validityStart" label="Validity Start" rules={[{ required: true }]}>
  //           <DatePicker showTime />
  //         </Form.Item>
  //         <Form.Item name="validityEnd" label="Validity End" rules={[{ required: true }]}>
  //           <DatePicker showTime />
  //         </Form.Item>
  //         {["generalData", "masterData", "epiQuestions"].map((field) => (
  //           <Form.Item
  //             name={field}
  //             label={field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
  //             key={field}
  //             rules={[{ required: true }]}
  //           >
  //             <Select
  //               onChange={(value) => handleOtherChange(field as keyof typeof dropdownOptions, value)}
  //               options={[
  //                 ...dropdownOptions[field as keyof typeof dropdownOptions].map((item) => ({
  //                   label: item,
  //                   value: item,
  //                 })),
  //                 { label: "Other", value: "Other" },
  //               ]}
  //             />
  //           </Form.Item>
  //         ))}
  //         {Object.keys(isOther).map((field) =>
  //           isOther[field as keyof typeof isOther] ? (
  //             <Form.Item
  //               name={`other_${field}`}
  //               label={`Enter ${field.replace(/([A-Z])/g, " $1")}`}
  //               key={`other_${field}`}
  //               rules={[{ required: true }]}
  //             >
  //               <Input />
  //             </Form.Item>
  //           ) : null
  //         )}
  //         <Form.Item name="video" label="Video" rules={[{ required: true }]}>
  //           <Select
  //             options={[
  //               { label: "Yes", value: 1 },
  //               { label: "No", value: 0 },
  //             ]}
  //           />
  //         </Form.Item>
  //       </Form>
  //     </Modal>
  //   </div>
  // );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Test Repository</h2>
        <Button
          type="primary"
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          Add Test 1
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="testId"
        className={styles.table}
      />
      <Modal
        title="Add Test"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        className={styles.modal}
      >
        {/* <Form form={form} onFinish={handleAddTest} layout="vertical">
          <Form.Item
            name="testDescription"
            label="Test Description"
            rules={[{ required: true }]}
            className={styles.formItem}
          >
            <Input className={styles.input} />
          </Form.Item>
          <Form.Item
            name="validityStart"
            label="Validity Start"
            rules={[{ required: true }]}
            className={styles.formItem}
          >
            <DatePicker showTime />
          </Form.Item>
          <Form.Item
            name="validityEnd"
            label="Validity End"
            rules={[{ required: true }]}
            className={styles.formItem}
          >
            <DatePicker showTime />
          </Form.Item>
          <Form.Item
      name="generalData"
      label="General Data"
      rules={[{ required: true }]}
      className={styles.formItem}
    >
      <Input className={styles.input} />
    </Form.Item>
    <Form.Item
      name="masterData"
      label="Master Data"
      rules={[{ required: true }]}
      className={styles.formItem}
    >
      <Input className={styles.input} />
    </Form.Item>
    <Form.Item
      name="epiQuestions"
      label="EPI Questions"
      rules={[{ required: true }]}
      className={styles.formItem}
    >
      <Input className={styles.input} />
    </Form.Item>
          <Form.Item
            name="video"
            label="Video"
            rules={[{ required: true }]}
            className={styles.formItem}
          >
            <Select
              className={styles.select}
              options={[
                { label: "Yes", value: 1 },
                { label: "No", value: 0 },
              ]}
            />
          </Form.Item>
        </Form> */}
        <Form form={form} onFinish={handleAddTest} layout="vertical">
  <Form.Item
    name="TEST_DESCRIPTION"
    label="Test Description"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Input className={styles.input} />
  </Form.Item>
  <Form.Item
    name="VALIDITY_START"
    label="Validity Start"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <DatePicker showTime />
  </Form.Item>
  <Form.Item
    name="VALIDITY_END"
    label="Validity End"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <DatePicker showTime />
  </Form.Item>
  <Form.Item
    name="generalData"
    label="General Data"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Input className={styles.input} />
  </Form.Item>
  <Form.Item
    name="masterData"
    label="Master Data"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Input className={styles.input} />
  </Form.Item>
  <Form.Item
    name="epiQuestion"
    label="EPI Questions"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Input className={styles.input} />
  </Form.Item>
  <Form.Item
    name="QUESTION_SELECTION_METHOD"
    label="Question Selection Method"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Input className={styles.input} />
  </Form.Item>
  <Form.Item
    name="VIDEO"
    label="Video"
    rules={[{ required: true }]}
    className={styles.formItem}
  >
    <Select
      className={styles.select}
      options={[
        { label: "Yes", value: 1 },
        { label: "No", value: 0 },
      ]}
    />
  </Form.Item>
</Form>

      </Modal>
    </div>
  );
};

export default ManageTestRepositoryPage;
