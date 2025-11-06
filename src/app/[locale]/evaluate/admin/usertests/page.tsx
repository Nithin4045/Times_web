"use client";
import React, { useEffect, useState } from 'react';
import { Upload, Button, message, Table } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';
import { FaPlusCircle } from 'react-icons/fa';
import { useRouter } from "next/navigation";

const Home = () => {
  const [fileList, setFileList] = useState([]);
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Updated columns based on new fields without DatePicker
  const columns = [
   
    {
        title: 'USER TEST ID',
        dataIndex: 'user_test_id',
        key: 'user_test_id',
      },
    {
      title: 'Test ID',
      dataIndex: 'test_id',
      key: 'test_id',
    },
    {
      title: 'Validity Start',
      dataIndex: 'VALIDITY_START',
      key: 'VALIDITY_START',
    },
    {
      title: 'Validity End',
      dataIndex: 'VALIDITY_END',
      key: 'VALIDITY_END',
    },
    {
      title: 'User Name',
      dataIndex: 'USER_NAME',
      key: 'USER_NAME',
    },
    {
      title: 'Access',
      dataIndex: 'access',
      key: 'access',
    },
    {
      title: 'Test Name',
      dataIndex: 'test_name',
      key: 'test_name',
    },
    {
      title: 'User Data',
      dataIndex: 'user_data',
      key: 'user_data',
    },
    {
      title: 'Epi Data',
      dataIndex: 'epi_data',
      key: 'epi_data',
    },
    {
      title: 'Dist Count',
      dataIndex: 'distCount',
      key: 'distCount',
    },
    {
      title: 'Dist Secs',
      dataIndex: 'distSecs',
      key: 'distSecs',
    },
    {
      title: 'Video',
      dataIndex: 'video',
      key: 'video',
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: 'Batch Code',
      dataIndex: 'BATCH_CODE',
      key: 'BATCH_CODE',
    },
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/evaluate/Admin/usertests");
      setTestData(response.data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const props: UploadProps = {
    action: `/api/evaluate/Admin/usertests?subfolder=USER_TESTS&table=USER_TESTS`,
    onChange({ file, fileList }) {
      if (file.status === 'done') {
        // Show success message if the file upload was successful
        message.success('File uploaded successfully!');
      } else if (file.status === 'error') {
        // Show error message if the upload failed
        message.error('File upload failed.');
      }
    },
    onRemove(file) {
      // Handle file removal if needed
      console.log('removed file', file);
    },
    beforeUpload(file) {
      // You can add validation here before the file is uploaded
      return true;
    }
  };

  return (
    <div style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', marginLeft: '10px', marginTop: '30px' }}>
        <div><h1>Upload User Tests </h1></div>

        <div>
          <Upload {...props}>
            <Button
              icon={<UploadOutlined />}
              style={{ padding: '19px', marginTop: '30px', marginLeft: '710px' }}
            >
              Select Excel File
            </Button>
          </Upload>
        </div>

        <div>
          <Button
            type="primary"
            icon={<FaPlusCircle />}
            onClick={() => router.push("/evaluate/admin/usertests/AddNewQuestions")}
            style={{ padding: '19px', marginTop: '30px', marginLeft: '15px' }}
          >
            Add User Tests
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={testData}
        rowKey="test_id"
        style={{ marginTop: '30px', width: '100%' }}
        loading={loading}
      />
    </div>
  );
};

export default Home;
