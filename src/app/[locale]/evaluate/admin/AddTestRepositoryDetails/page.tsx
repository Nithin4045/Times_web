

"use client";
import React, { useEffect, useState } from 'react';
import { Upload, Button, message, Table } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';
import { FaPlusCircle } from 'react-icons/fa';
import { useRouter } from "next/navigation";

import { render } from '@antv/g2';

const Home = () => {
  const [fileList, setFileList] = useState([]);
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const router = useRouter();

  // Handle file change event
  // const handleFileChange = (info) => {
  //   setFileList(info.fileList);
  // };

  // Handle form submission and upload the data to the server
  // const handleUpload = async () => {
  //   if (fileList.length === 0) {
  //     message.error('Please upload a file first');
  //     return;
  //   }

  //   // const router = useRouter();


  //   const formData = new FormData();
  //   formData.append('file', fileList[0].originFileObj);

  //   setLoading(true);
  // };

  const columns = [
    {
      title: 'Repository ID',
      dataIndex: 'repository_details_id',
      key: 'repository_details_id',
      
    },
    {
      title: 'Test ID',
      dataIndex: 'test_id',
      key: 'test_id',
    },
    {
      title: 'Subject ID',
      dataIndex: 'subject_id',
      key: 'subject_id',
    },
    {
      title: 'Question Count',
      dataIndex: 'question_count',
      key: 'question_count',
    },
    {
      title: 'Duration (min)',
      dataIndex: 'duration_min',
      key: 'duration_min',
    },
    {
      title: 'Rendering Order',
      dataIndex: 'rendering_order',
      key: 'rendering_order',
    },
    {
      title: 'Selection Method',
      dataIndex: 'selection_method',
      key: 'selection_method',
    },
    {
      title: 'Topic ID',
      dataIndex: 'TOPIC_ID',
      key: 'TOPIC_ID',
      render: (text: any) => text ?? 'NULL',
    },
    {
      title: 'Require Resource',
      dataIndex: 'REQUIRE_RESOURCE',
      key: 'REQUIRE_RESOURCE',
      render:(text : any) => text ?? 'NULL',
    },
    {
      title: 'Complexity',
      dataIndex: 'complexity',
      key: 'complexity',
      render:(text : any) => text ?? 'NULL',
    },
    {
      title: 'Subject Marks',
      dataIndex: 'subject_marks',
      key: 'subject_marks',
    },
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/evaluate/Admin/AddTestRepositoryDetails");
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
    action: `/api/evaluate/Admin/AddTestRepositoryDetails?subfolder=TEST_REPOSITORY_DETAILS&table=TEST_REPOSITORY_DETAILS`,
    onChange({ file, fileList }) {
      if (status === 'done') {
        // Show success message if the file upload was successful
        message.success('File uploaded successfully!');
      } else if (status === 'error') {
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
    <div style={{ flexDirection: 'column',}}>
      <div style={{display:'flex',marginLeft:'10px',marginTop:'30px'}}>
        <div><h1>Upload Test Repository Details</h1></div>
          
      {/* <h1 style={{ fontSize: '2rem', fontWeight: 'bold',marginRight:'70%',marginTop:'50px'}}>Upload Test Details</h1> */}
<div >
  
      <Upload {...props}>
          <Button className="primary-btn" icon={<UploadOutlined />} style={{padding:'19px',marginTop:'30px',
            marginLeft:'600px'}}>Select excel file</Button>
        </Upload>
          </div>
          <div><Button
          className="primary-btn"
            type="primary"
            icon={<FaPlusCircle />}
            onClick={() => router.push("/evaluate/admin/AddTestRepositoryDetails/AddNewQuestions")}
            style={{padding:'19px',marginTop:'30px',marginLeft:'15px'}}          >
            Add Test Repository Details
          </Button></div>
          </div>
      <Table
        columns={columns}
        dataSource={testData}
        rowKey="test_id"
        style={{ marginTop: '30px', width: '100%' }}
      />
     
    </div>
  );
};

export default Home;
