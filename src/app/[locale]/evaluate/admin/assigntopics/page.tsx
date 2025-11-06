
// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Button,
//   Card,
//   Dropdown,
//   Menu,
//   Select,
//   Space,
//   Typography,
//   Tag,
//   Modal,
// } from "antd";
// import { EllipsisOutlined } from "@ant-design/icons";
// import styles from "./assigntopics.module.css";

// const { Title } = Typography;
// const { Option } = Select;

// type Subject = {
//   subject_id: number;
//   subject_description: string;
// };

// const AssignSectionPage = () => {
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);

//   useEffect(() => {
//     fetch("/api/evaluate/Admin/addsection")
//       .then((res) => res.json())
//       .then((data) => setSubjects(data.tests || []))
//       .catch((err) => console.error("Failed to fetch subjects:", err));
//   }, []);

//   const handleSelect = (value: number) => {
//     const subject = subjects.find((sub) => sub.subject_id === value);
//     if (subject && !selectedSubjects.some((s) => s.subject_id === value)) {
//       setSelectedSubjects((prev) => [...prev, subject]);
//     }
//   };

//   const handleDeselect = (value: number) => {
//     setSelectedSubjects((prev) =>
//       prev.filter((subject) => subject.subject_id !== value)
//     );
//   };

//   const menu = (
//     <Menu>
//       <Menu.Item key="1">Edit</Menu.Item>
//       <Menu.Item key="2">Delete</Menu.Item>
//       <Menu.Item key="3">View</Menu.Item>
//     </Menu>
//   );

//   return (
//     <div className={styles.container}>
//       <Title level={3} className={styles.title}>
//         Assign Sections
//       </Title>

//       <Button
//         type="primary"
//         className={styles.addButton}
//         onClick={() => setIsModalVisible(true)}
//       >
//         Assign Section
//       </Button>

//       <Modal
//   title="Select Subjects"
//   open={isModalVisible}
//   onCancel={() => setIsModalVisible(false)}
//   footer={[
//     <Button key="done" type="primary" onClick={() => setIsModalVisible(false)}>
//       Done
//     </Button>,
//   ]}
// >
//   <div className="modalContent">
//     <div className="searchAndChipsContainer">
//       <Select
//         mode="multiple"
//         placeholder="Select Subjects"
//         onSelect={handleSelect}
//         onDeselect={handleDeselect}
//         className="selectDropdown"
//         optionLabelProp="label"
//         showSearch
//         filterOption={(input, option) =>
//           String(option?.label ?? "")
//             .toLowerCase()
//             .includes(input.toLowerCase())
//         }
//         style={{ minWidth: '200px', flexShrink: 0 }}
//       >
//         {subjects.map((subject) => (
//           <Select.Option
//             key={subject.subject_id}
//             value={subject.subject_id}
//             label={subject.subject_description}
//           >
//             <Space>
//               <input
//                 type="checkbox"
//                 checked={selectedSubjects.some(
//                   (s) => s.subject_id === subject.subject_id
//                 )}
//                 readOnly
//               />
//               {subject.subject_description}
//             </Space>
//           </Select.Option>
//         ))}
//       </Select>

     
//     </div>
//   </div>
// </Modal>


//       <div className={styles.cardGrid}>
//         {selectedSubjects.map((subject) => (
//           <Card key={subject.subject_id} className={styles.card}>
//             <div className={styles.cardContent}>
//               <span className={styles.subjectName}>
//                 {subject.subject_description.length > 20
//                   ? subject.subject_description.substring(0, 20) + "..."
//                   : subject.subject_description}
//               </span>
//               <Space>
//                 <Button type="link" className={styles.assignButton}>
//                   Assign Topic
//                 </Button>
//                 <Dropdown overlay={menu} trigger={["click"]}>
//                   <EllipsisOutlined className={styles.moreIcon} />
//                 </Dropdown>
//               </Space>
//             </div>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AssignSectionPage;






// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Button,
//   Card,
//   Select,
//   Space,
//   Typography,
//   Modal,
//   Checkbox,
// } from "antd";
// import styles from "./assigntopics.module.css";

// const { Title } = Typography;

// type Subject = {
//   subject_id: number;
//   subject_description: string;
// };

// type Topic = {
//   TOPIC_ID: number;
//   topic_name: string;
//   subject_id?: number; 
// };

// const AssignSectionPage = () => {
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isAssignTopicModalVisible, setIsAssignTopicModalVisible] = useState(false);
//   const [topics, setTopics] = useState<Topic[]>([]);
//   const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
//   const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       try {
//         const res = await fetch("/api/evaluate/Admin/addsection");
//         const data = await res.json();
//         setSubjects(data.tests || []);
//       } catch (err) {
//         console.error("Failed to fetch subjects:", err);
//       }
//     };

//     const fetchTopics = async () => {
//       try {
//         const res = await fetch("/api/evaluate/Admin/get-topics");
//         const data = await res.json();
//         setTopics(data.topics || []);
//       } catch (err) {
//         console.error("Failed to fetch topics:", err);
//       }
//     };

//     fetchSubjects();
//     fetchTopics();
//   }, []);

//   const handleSelect = (value: number) => {
//     const subject = subjects.find((sub) => sub.subject_id === value);
//     if (subject && !selectedSubjects.some((s) => s.subject_id === value)) {
//       setSelectedSubjects((prev) => [...prev, subject]);
//     }
//   };

//   const handleDeselect = (value: number) => {
//     setSelectedSubjects((prev) =>
//       prev.filter((subject) => subject.subject_id !== value)
//     );
//   };

//   const handleAssignTopic = async (subject: Subject) => {
//     setCurrentSubject(subject);
//     setIsAssignTopicModalVisible(true);

//     try {
//       // Fetch already assigned topics for this subject
//       const res = await fetch(`/api/evaluate/Admin/get-subject-topics?subject_id=${subject.subject_id}`);
//       const assignedData = await res.json();

//       if (Array.isArray(assignedData)) {
//         const assignedTopicIds = assignedData.map((item: any) => item.TOPIC_ID);
//         setSelectedTopics(assignedTopicIds);
//       }
//     } catch (err) {
//       console.error("Failed to fetch assigned topics:", err);
//     }
//   };

//   const handleTopicSelection = async (topicId: number, checked: boolean) => {
//     const subjectId = currentSubject?.subject_id;
//     if (!subjectId) return;

//     try {
//       if (checked) {
//         await fetch("/api/evaluate/Admin/get-topics", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ subject_id: subjectId, topic_id: topicId }),
//         });
//         setSelectedTopics((prev) => [...prev, topicId]);
//       } else {
//         await fetch("/api/evaluate/Admin/remove-topic", {
//           method: "DELETE",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ subject_id: subjectId, topic_id: topicId }),
//         });
//         setSelectedTopics((prev) => prev.filter((id) => id !== topicId));
//       }
//     } catch (err) {
//       console.error("Failed to update topic selection:", err);
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <Title level={3} className={styles.title}>
//         Assign Sections
//       </Title>

//       <Button
//         type="primary"
//         className={styles.addButton}
//         onClick={() => setIsModalVisible(true)}
//       >
//         Assign Section
//       </Button>

//       <Modal
//         title="Select Subjects"
//         open={isModalVisible}
//         onCancel={() => setIsModalVisible(false)}
//         footer={[
//           <Button key="done" type="primary" onClick={() => setIsModalVisible(false)}>
//             Done
//           </Button>,
//         ]}
//       >
//         <Select
//           mode="multiple"
//           placeholder="Select Subjects"
//           onSelect={handleSelect}
//           onDeselect={handleDeselect}
//           value={selectedSubjects.map((s) => s.subject_id)}
//           style={{ minWidth: "200px", flexShrink: 0 }}
//         >
//           {subjects.map((subject) => (
//             <Select.Option key={subject.subject_id} value={subject.subject_id}>
//               {subject.subject_description}
//             </Select.Option>
//           ))}
//         </Select>
//       </Modal>

//       <div className={styles.cardGrid}>
//         {selectedSubjects.map((subject) => (
//           <Card key={subject.subject_id} className={styles.card}>
//             <div className={styles.cardContent}>
//               <span className={styles.subjectName}>{subject.subject_description}</span>
//               <Space>
//                 <Button
//                   type="link"
//                   className={styles.assignButton}
//                   onClick={() => handleAssignTopic(subject)}
//                 >
//                   Assign Topic
//                 </Button>
//               </Space>
//             </div>
//           </Card>
//         ))}
//       </div>

//       <Modal
//         title="Assign Topics"
//         open={isAssignTopicModalVisible}
//         onCancel={() => setIsAssignTopicModalVisible(false)}
//         footer={[
//           <Button key="done" type="primary" onClick={() => setIsAssignTopicModalVisible(false)}>
//             Done
//           </Button>,
//         ]}
//       >
//         {topics.map((topic: Topic) => (
//           <Checkbox
//             key={topic.TOPIC_ID}
//             checked={selectedTopics.includes(topic.TOPIC_ID)}
//             onChange={(e) =>
//               handleTopicSelection(topic.TOPIC_ID, e.target.checked)
//             }
//           >
//             {topic.TOPIC_ID}
//           </Checkbox>
//         ))}
//       </Modal>
//     </div>
//   );
// };

// export default AssignSectionPage;











'use client';
import React, { useEffect, useState } from "react";
import { Button, Table, Space, message, Modal, Checkbox, Spin, Tag, Tooltip, Form, InputNumber, Select, Input } from "antd";
import { PlusOutlined, DeleteOutlined, PlusCircleOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";


interface SectionData {
  subject_id: number;
  subject_description: string;
  subject_code: string;
}

interface TopicData {
  TOPIC_ID: number;
  question_count: number;
  rendering_order:number;
  complexity:number;
  duration_min:number;
}

interface SubjectData {
  subject_id: number;
  subject_name: string;
  subject_description: string;
}

const AssignSection = () => {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [topics, setTopics] = useState<{ [key: number]: TopicData[] }>({});
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

 // For topics modal
 const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
 const [availableTopics, setAvailableTopics] = useState<TopicData[]>([]);
 const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
 const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
 const [isTopicAssignModalOpen, setIsTopicAssignModalOpen] = useState(false);
 const [selectedSubjectDescription, setSelectedSubjectDescription] = useState<string | null>(null);
 


 // For topic assignment form modal

 const [form] = Form.useForm();
 const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  useEffect(() => {
    
      fetchSectionData();
    
  }, []);

  const fetchSectionData = async () => {
    try {
      const response = await axios.get(`/api/evaluate/Admin/assigned-sections`);
      const res_data =response.data
      setSections(res_data.topics || []);
      fetchAllTopics(res_data.topics );
    } catch (error) {
      message.error("Failed to load section data");
    }
  };

  // const fetchAllTopics = async (sectionsData: SectionData[]) => {
  //   try {
  //     const topicPromises = sectionsData.map((section) =>
  //       axios
  //         .get(`/api/evaluate/Admin/get-subject-topics`)
  //         .then((res) => ({ subject_id: section.subject_id, topics: res.data }))
  //         .catch(() => ({ subject_id: section.subject_id, topics: [] }))
  //     );

  //     const topicResults = await Promise.all(topicPromises);
  //     const topicsMap: { [key: number]: TopicData[] } = {};
  //     topicResults.forEach((result) => {
  //       topicsMap[result.subject_id] = result.topics;
  //     });
  //     setTopics(topicsMap);
  //   } catch (error) {
  //     message.error("Failed to fetch topics data");
  //   }
  // };



  const fetchAllTopics = async (sectionsData: SectionData[]) => {
    try {
        const topicPromises = sectionsData.map((section) =>
            axios
                .get(`/api/evaluate/Admin/get-subject-topics?subject_id=${section.subject_id}`)
                .then((res) => ({ subject_id: section.subject_id, topics: res.data }))
                .catch(() => ({ subject_id: section.subject_id, topics: [] }))
        );

        const topicResults = await Promise.all(topicPromises);
        const topicsMap: { [key: number]: TopicData[] } = {};
        topicResults.forEach((result) => {
            topicsMap[result.subject_id] = result.topics;
        });
        setTopics(topicsMap);
    } catch (error) {
        message.error("Failed to fetch topics data");
    }
};

  const handleAssign = () => {
    setIsModalOpen(true);
    fetchSubjectsData();
  };

  const fetchSubjectsData = async () => {
    setLoading(true);
    try {
      const { data: allSubjects } = await axios.get("/api/evaluate/Admin/get-sections");
      console.log('all subjects :',allSubjects)
      setSubjects(allSubjects.topics);
      const selectedIds = sections.map((section) => section.subject_id);
      setSelectedSubjects(selectedIds);
    } catch (error) {
      message.error("Error fetching subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (subject: SubjectData, checked: boolean) => {
    if (checked) {
      setSelectedSubjects((prev) => [...prev, subject.subject_id]);
      setSections((prev) => [
        ...prev,
        {
          subject_id: subject.subject_id,
          subject_description: subject.subject_description,
          subject_code: "",
        },
      ]);
    } else {
      try {
        await axios.delete(`/api/evaluate/Admin/get-sections`, {
          data: {subject_id: subject.subject_id },
        });
        setSelectedSubjects((prev) => prev.filter((id) => id !== subject.subject_id));
        setSections((prev) => prev.filter((section) => section.subject_id !== subject.subject_id));
        message.success("Subject removed successfully");
      } catch (error) {
        message.error("Failed to remove subject");
      }
    }
  };


  const handleDeleteSubject = async (subject: SectionData) => {
    try {
      await axios.delete(`/api/evaluate/Admin/get-sections`, {
        data: { subject_id: subject.subject_id },
      });
      message.success("Subject deleted successfully.");
  
      // Update the sections state to remove the deleted subject
      setSections((prevSections) =>
        prevSections.filter((item) => item.subject_id !== subject.subject_id)
      );
  
      // Optionally, update the topics state if needed
      setTopics((prevTopics) => {
        const updatedTopics = { ...prevTopics };
        delete updatedTopics[subject.subject_id];
        return updatedTopics;
      });
    } catch (error) {
      message.error("Failed to delete subject.");
    }
  };
  
  

  // Handle assign topic modal
  const handleAssignTopic = async (subjectId: number) => {
    setSelectedSubjectId(subjectId);
    setIsTopicModalOpen(true);

    try {
      const { data } = await axios.get(`/api/evaluate/Admin/get-topics`);
     
      setAvailableTopics(data.topics);

      // Fetch already assigned topics
      const assignedTopics = topics[subjectId]?.map((t) => t.TOPIC_ID) || [];
      setSelectedTopics(assignedTopics);
    } catch (error) {
      message.error("Failed to fetch topics for the subject");
    }
  };


  // const handleDeleteTopic = async (subjectId: number, topicId: string) => {
  //   try {
  //     const response = await fetch('/api/evaluate/Admin/assign-topic', {
  //       method: 'DELETE',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ subject_id: subjectId, topic_id: topicId }),
  //     });
  
  //     if (response.ok) {
  //       console.log('Topic deleted successfully!');
  //       setSelectedTopics((prev) => prev.filter((id: any) => id !== topicId));
  //       await fetchAllTopics(sections);
  //     } else {
  //       const errorData = await response.json();
  //       console.error('Failed to delete topic:', errorData.error || 'Unknown error');
  //     }
  //   } catch (error) {
  //     console.error('Failed to delete topic:', error);
  //   }
  // };
  
  const handleDeleteTopic = async (subjectId: number, topicId: string) => {
    try {
        const response = await fetch('/api/evaluate/Admin/get-topics', { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject_id: subjectId, topic_id: topicId }),
        });

        if (response.ok) {
            console.log('Topic deleted successfully!');
            setSelectedTopics((prev) => prev.filter((id: any) => id !== topicId));
            await fetchAllTopics(sections);
        } else {
            const errorData = await response.json();
            console.error('Failed to delete topic:', errorData.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Failed to delete topic:', error);
    }
};

  // const handleTopicSelect = async (topicId: number, checked: boolean) => {
  //   if (checked) {
  //     setSelectedTopics((prev) => [...prev, topicId]);
  //     setCurrentTopicId(topicId);
      
    
  //     try {
  //       const response = await fetch('/api/evaluate/Admin/get-topics', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           subject_id: selectedSubjectId ,
  //           topic_id: currentTopicId,
  //         }),
  //       });
    
  //       const data = await response.json();
  //       if (response.ok) {
  //         console.log(data.message); 
  //         await fetchAllTopics(sections);
  //       } else {
  //         console.error(data.error || 'Failed to assign topic');
  //       }
  //     } catch (error) {
  //       console.error('Error calling POST API:', error);
  //     }
    
    
  //     await fetchAllTopics(sections);
  //   } else {
  //     try {
  //       // await handleDeleteTopic(selectedSubjectId!, currentTopicId);
  //       setSelectedTopics((prev) => prev.filter((id) => id !== topicId));
  //     } catch (error) {
  //       console.error('Failed to delete topic on close:', error);
  //     }
  //   }    
  // };
  
  

  const handleTopicSelect = async (topicId: number, checked: boolean) => {
    if (checked) {
        setSelectedTopics((prev) => [...prev, topicId]);
        setCurrentTopicId(topicId);
        try {
            const response = await fetch('/api/evaluate/Admin/get-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_id: selectedSubjectId,
                    topic_id: topicId,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log(data.message); 
                await fetchAllTopics(sections);
            } else {
                console.error(data.error || 'Failed to assign topic');
            }
        } catch (error) {
            console.error('Error calling POST API:', error);
        }
    } else {
        try {
            await handleDeleteTopic(selectedSubjectId!, topicId.toString()); // Ensure topicId is a string
        } catch (error) {
            console.error('Failed to delete topic on close:', error);
        }
    }    
};

  const modalColumns = [

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          
          <Tooltip title="Delete Topic">
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "red" }} />}
              onClick={() => handleDeleteTopic(selectedSubjectId!, record.TOPIC_ID)}
              // onClick={() => handleDeleteTopic(record.TOPIC_ID)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Section",
      dataIndex: "subject_description",
      key: "subject_description",
      render: () => <span>{selectedSubjectDescription || "No Section"}</span>,
    },
    {
      title: "Topic",
      dataIndex: "TOPIC_ID",
      key: "TOPIC_ID",
    },
  
  ];
  
  const handleOpenModal = (subjectId: number, subjectDescription:string) => {
    setSelectedSubjectId(subjectId);
    setSelectedSubjectDescription(subjectDescription);
    setIsTopicAssignModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTopicAssignModalOpen(false);
    setSelectedSubjectId(null);
  };

  // const columns = [
  //   {
  //     title: "Actions",
  //     key: "actions",
  //     render: (_: any, record: SectionData) => (
  //       <Space>
  //         <Tooltip title="Assign Topic">
  //           <PlusCircleOutlined style={{ color: "green" }}
  //           onClick={() => handleOpenModal(record.subject_id,record.subject_description)}
            
  //             />
  //         </Tooltip>
  //         <Tooltip title="Delete Subject">
  //           <DeleteOutlined style={{ color: "red" }} onClick={() => handleDeleteSubject(record)} />

  //         </Tooltip>
  //       </Space>
  //     ),
  //   },
  //   {
  //     title: "Sections",
  //     dataIndex: "subject_description",
  //     key: "subject_description",
  //   },    
  //   {
  //     title: "Topics",
  //     key: "TOPIC_ID",
  //     render: (_: any, record: SectionData) => {
  //       const topicList = topics[record.subject_id] || [];
  //       return (
  //         <Space wrap>
  //           {topicList.map((topic) => (
  //             <Tag key={topic.TOPIC_ID} closable onClose={() => handleTopicSelect(topic.TOPIC_ID, false)} >
  //               {topic.TOPIC_ID}
  //             </Tag>
  //           ))}
  //         </Space>
  //       );
  //     },
  //   },
    
  // ];

  
  const columns = [
    {
        title: "Actions",
        key: "actions",
        render: (_: any, record: SectionData) => (
            <Space>
                <Tooltip title="Assign Topic">
                    <PlusCircleOutlined
                        style={{ color: "green" }}
                        onClick={() => handleOpenModal(record.subject_id, record.subject_description)}
                    />
                </Tooltip>
                <Tooltip title="Delete Subject">
                    <DeleteOutlined
                        style={{ color: "red" }}
                        onClick={() => handleDeleteSubject(record)}
                    />
                </Tooltip>
            </Space>
        ),
    },
    {
        title: "Sections",
        dataIndex: "subject_description",
        key: "subject_description",
    },
    {
        title: "Topics",
        key: "TOPIC_ID",
        render: (_: any, record: SectionData) => {
            const topicList = topics[record.subject_id] || [];
            return (
                <Space wrap>
                    {topicList.map((topic) => (
                        <Tag
                            key={topic.TOPIC_ID}
                            closable
                            onClose={() => handleTopicSelect(topic.TOPIC_ID, false)}
                        >
                            {topic.TOPIC_ID}
                        </Tag>
                    ))}
                </Space>
            );
        },
    },
];

  return (
    <div style={{marginTop:'100px'}}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAssign}>
          Assign Section
        </Button>
      </Space>

      <Table dataSource={sections} columns={columns} rowKey="subject_id" />

      <Modal
        title="Assign Subjects"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={<Button onClick={() => setIsModalOpen(false)}>Done</Button>}
      >
        {loading ? (
          <Spin />
        ) : (
          <div>
            {subjects.map((subject:any) => (
              <Checkbox
                key={subject.subject_id}
                checked={selectedSubjects.includes(subject.subject_id)}
                onChange={(e) => handleCheckboxChange(subject, e.target.checked)}
              >
                {subject.subject_description}
              </Checkbox>
            ))}
          </div>
        )}
      </Modal>
      <Modal
        title="Assign Topics"
        open={isTopicModalOpen}
        onCancel={() => setIsTopicModalOpen(false)}
        footer={null}
      >
        {availableTopics.map((topic) => (
          <Checkbox
            key={topic.TOPIC_ID}
            checked={selectedTopics.includes(topic.TOPIC_ID)}
            onChange={(e) => handleTopicSelect(topic.TOPIC_ID, e.target.checked)}
          >
            {topic.TOPIC_ID}
          </Checkbox>
        ))}
      </Modal>

     
      <Modal
        title={<div className="flex space-between items-center">
          <span>Assign Topic</span>
          
        </div>}
        open={isTopicAssignModalOpen}
        onCancel={handleCloseModal}
        onOk={handleCloseModal}
        footer={null}
        width="100vw"
        
      >
        <Space style={{ marginBottom: 16 }}>
        <Button
            type="primary"
            onClick={() => handleAssignTopic(selectedSubjectId!)}
            disabled={!selectedSubjectId}
          >
            Assign Topic
          </Button>
        </Space>
        
        <Table
          columns={modalColumns}
          dataSource={selectedSubjectId ? topics[selectedSubjectId] : []}
          rowKey="TOPIC_ID"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default AssignSection;










