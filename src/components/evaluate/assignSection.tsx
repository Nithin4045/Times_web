

// import { useState, useEffect } from "react";
// import { Tag, Spin, Input, Tooltip, Button } from "antd";
// import { DownOutlined, SearchOutlined, UpOutlined } from "@ant-design/icons";
// import axios from "axios";
// import styles from "@/assets/styles/evaluate/addSection.module.css"; 

// interface AddSectionProps {
//   testId: number;
// }

// const AddSection: React.FC<AddSectionProps> = ({ testId }) => {
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       try {
//         const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
//         const { data: testSubjects } = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);

//         const selectedIds = testSubjects.map((sub: any) => sub.subject_id);
//         setSubjects(allSubjects);
//         setSelectedSubjects(selectedIds);
//       } catch (error) {
//         console.error("Error fetching subjects:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubjects();
//   }, [testId]);

//   const toggleSubject = (subjectId: number) => {
//     setSelectedSubjects((prev) =>
//       prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
//     );
//   };

//   const filteredSubjects = subjects.filter((subject) =>
//     subject.subject_description.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) return <Spin />;

//   return (
//     <div className={styles.container}>
//       {/* Available Sections Header with Search */}
//       <div className={styles.header}>
//         <h3>Available Sections</h3>
//         <Input
//           placeholder="Search Sections..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//           prefix={<SearchOutlined className={styles.searchIcon} />}
//         />
//       </div>
//       {/* Chips Display */}
//       <div className={`${styles.chipsContainer} ${showAll ? styles.expanded : ""}`}>
//         {filteredSubjects.slice(0, showAll ? filteredSubjects.length : 5).map((subject) => (
//           <Tag
//             key={subject.subject_id}
//             color={selectedSubjects.includes(subject.subject_id) ? "blue" : "default"}
//             onClick={() => toggleSubject(subject.subject_id)}
//             className={styles.chip}
//           >
//             {subject.subject_description}
//           </Tag>
//         ))}
//       </div>

//       {/* Expand/Collapse Button */}
//       {filteredSubjects.length > 5 && (
//         <Tooltip title={showAll ? "Collapse" : "Expand"}>
//             <Button className={styles.down_button}><div className={styles.toggleButton} onClick={() => setShowAll(!showAll)}>
//             {showAll ? <UpOutlined /> : <DownOutlined />}
//           </div></Button>
          
//         </Tooltip>
//       )}

//       {/* Assigned Sections */}
//       <h3>Assigned Sections</h3>
//       <div className={styles.chipsContainer}>
//         {selectedSubjects.map((id) => {
//           const subject = subjects.find((sub) => sub.subject_id === id);
//           return subject ? (
//             <Tag key={id} color="blue" className={styles.chip}>
//               {subject.subject_description}
//             </Tag>
//           ) : null;
//         })}
//       </div>
//     </div>
//   );
// };

// export default AddSection;








// import { useState, useEffect } from "react";
// import { Tag, Spin, Input, Tooltip, Button } from "antd";
// import { DownOutlined, SearchOutlined, UpOutlined } from "@ant-design/icons";
// import axios from "axios";
// import styles from "@/assets/styles/evaluate/addSection.module.css"; 

// interface AddSectionProps {
//   testId: number;
// }

// const AddSection: React.FC<AddSectionProps> = ({ testId }) => {
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Topics-related states
//   const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<number | null>(null);
//   const [availableTopics, setAvailableTopics] = useState<any[]>([]);
//   const [assignedTopics, setAssignedTopics] = useState<any[]>([]);
//   const [topicsLoading, setTopicsLoading] = useState(false);

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       try {
//         const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
//         const { data: testSubjects } = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);

//         const selectedIds = testSubjects.map((sub: any) => sub.subject_id);
//         setSubjects(allSubjects);
//         setSelectedSubjects(selectedIds);
//       } catch (error) {
//         console.error("Error fetching subjects:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubjects();
//   }, [testId]);

//   const toggleSubject = (subjectId: number) => {
//     setSelectedSubjects((prev) =>
//       prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
//     );
//   };

//   const handleSubjectClick = async (subjectId: number) => {
//     setSelectedSubjectForTopics(subjectId);
//     setTopicsLoading(true);
    
//     try {
//       // Fetch Available Topics
//       const { data: topics } = await axios.get(`/api/evaluate/Admin/topics?subject_id=${subjectId}`);
//       setAvailableTopics(topics);

//       // Fetch Assigned Topics from TEST_REPOSITORY_DETAILS
//       const { data: assigned } = await axios.get(
//         `/api/evaluate/Admin/assignedtopics?test_id=${testId}&subject_id=${subjectId}`
//       );
//       setAssignedTopics(assigned);
//     } catch (error) {
//       console.error("Error fetching topics:", error);
//     } finally {
//       setTopicsLoading(false);
//     }
//   };

//   const filteredSubjects = subjects.filter((subject) =>
//     subject.subject_description.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) return <Spin />;

//   return (
//     <div className={styles.container}>
//       {/* Available Sections Header with Search */}
//       <div className={styles.header}>
//         <h3>Available Sections</h3>
//         <Input
//           placeholder="Search Sections..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//           prefix={<SearchOutlined className={styles.searchIcon} />}
//         />
//       </div>

//       {/* Chips Display */}
//       <div className={`${styles.chipsContainer} ${showAll ? styles.expanded : ""}`}>
//         {filteredSubjects.slice(0, showAll ? filteredSubjects.length : 5).map((subject) => (
//           <Tag
//             key={subject.subject_id}
//             color={selectedSubjects.includes(subject.subject_id) ? "blue" : "default"}
//             onClick={() => toggleSubject(subject.subject_id)}
//             className={styles.chip}
//           >
//             {subject.subject_description}
//           </Tag>
//         ))}
//       </div>

//       {/* Expand/Collapse Button */}
//       {filteredSubjects.length > 5 && (
//         <Tooltip title={showAll ? "Collapse" : "Expand"}>
//           <Button className={styles.down_button}>
//             <div className={styles.toggleButton} onClick={() => setShowAll(!showAll)}>
//               {showAll ? <UpOutlined /> : <DownOutlined />}
//             </div>
//           </Button>
//         </Tooltip>
//       )}

//       {/* Assigned Sections */}
//       <h3>Assigned Sections</h3>
//       <div className={styles.chipsContainer}>
//         {selectedSubjects.map((id) => {
//           const subject = subjects.find((sub) => sub.subject_id === id);
//           return subject ? (
//             <Tag
//               key={id}
//               color="blue"
//               className={styles.chip}
//               onClick={() => handleSubjectClick(id)}
//             >
//               {subject.subject_description}
//             </Tag>
//           ) : null;
//         })}
//       </div>

//       {/* Available & Assigned Topics (Only if Subject Clicked) */}
//       {selectedSubjectForTopics !== null && (
//         <div className={styles.topicContainer}>
//           <h3>Available Topics</h3>
//           {topicsLoading ? (
//             <Spin />
//           ) : (
//             <div className={styles.chipsContainer}>
//               {availableTopics.map((topic) => (
//                 <Tag key={topic.TOPIC_ID} color="green" className={styles.chip}>
//                   {topic.TOPIC_ID}
//                 </Tag>
//               ))}
//             </div>
//           )}

//           <h3>Assigned Topics</h3>
//           {topicsLoading ? (
//             <Spin />
//           ) : (
//             <div className={styles.chipsContainer}>
//               {assignedTopics.map((topic) => (
//                 <Tag key={topic.TOPIC_ID} color="blue" className={styles.chip}>
//                   {topic.TOPIC_ID} - {topic.question_count} Questions
//                 </Tag>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddSection;













// import { useState, useEffect } from "react";
// import { Tag, Spin, Input, Tooltip, Button, Modal, Form, InputNumber, message } from "antd";
// import { DownOutlined, SearchOutlined, UpOutlined, CloseCircleOutlined } from "@ant-design/icons";
// import axios from "axios";
// import styles from "@/assets/styles/evaluate/addSection.module.css"; 

// interface AddSectionProps {
//   testId: number;
// }

// const AddSection: React.FC<AddSectionProps> = ({ testId }) => {
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Topics-related states
//   const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<number | null>(null);
//   const [availableTopics, setAvailableTopics] = useState<any[]>([]);
//   const [assignedTopics, setAssignedTopics] = useState<any[]>([]);
//   const [topicsLoading, setTopicsLoading] = useState(false);

//   // Modal states
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       try {
//         const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
//         const { data: testSubjects } = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);

//         const selectedIds = testSubjects.map((sub: any) => sub.subject_id);
//         setSubjects(allSubjects);
//         setSelectedSubjects(selectedIds);
//       } catch (error) {
//         console.error("Error fetching subjects:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubjects();
//   }, [testId]);
//   const toggleSubject = (subjectId: number) => {
//     setSelectedSubjects((prev) =>
//       prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
//     );
//   };

//   const handleSubjectClick = async (subjectId: number) => {
//     setSelectedSubjectForTopics(subjectId);
//     setTopicsLoading(true);
    
//     try {
//       const { data: topics } = await axios.get(`/api/evaluate/Admin/topics?subject_id=${subjectId}`);
//       setAvailableTopics(topics);

//       const { data: assigned } = await axios.get(
//         `/api/evaluate/Admin/assignedtopics?test_id=${testId}&subject_id=${subjectId}`
//       );
//       setAssignedTopics(assigned);
//     } catch (error) {
//       console.error("Error fetching topics:", error);
//     } finally {
//       setTopicsLoading(false);
//     }
//   };
//     const filteredSubjects = subjects.filter((subject) =>
//     subject.subject_description.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleEditTopic = (topic: any) => {
//     setSelectedTopic(topic);
//     form.setFieldsValue({
//       question_count: topic.question_count || 0,
//       duration_min: topic.duration_min || 0,
//     });
//     setIsModalVisible(true);
//   };

  // const handleSaveTopic = async () => {
  //   try {
  //     const values = await form.validateFields();
  //     if (!selectedTopic) return;

  //     await axios.post("/api/evaluate/Admin/assignTopic", {
  //       test_id: testId,
  //       subject_id: selectedSubjectForTopics,
  //       topic_id: selectedTopic.TOPIC_ID,
  //       question_count: values.question_count,
  //       duration_min: values.duration_min,
  //     });

  //     message.success("Topic updated successfully");
  //     setIsModalVisible(false);
  //     handleSubjectClick(selectedSubjectForTopics!);
  //   } catch (error) {
  //     console.error("Error updating topic:", error);
  //     message.error("Failed to update topic");
  //   }
  // };

//   const handleDeleteTopic = async (topicId: number) => {
//     try {
//       await axios.delete("/api/evaluate/Admin/deleteTopic", {
//         data: { test_id: testId, topic_id: topicId },
//       });

//       message.success("Topic removed successfully");
//       handleSubjectClick(selectedSubjectForTopics!);
//     } catch (error) {
//       console.error("Error deleting topic:", error);
//       message.error("Failed to remove topic");
//     }
//   };

//   if (loading) return <Spin />;

//   return (
//     <div className={styles.container}>
//       {/* Available Sections Header with Search */}
//       <div className={styles.header}>
//         <h3>Available Sections</h3>
//         <Input
//           placeholder="Search Sections..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//           prefix={<SearchOutlined className={styles.searchIcon} />}
//         />
//       </div>
      
//       {/* Chips Display */}
//        <div className={`${styles.chipsContainer} ${showAll ? styles.expanded : ""}`}>
//          {filteredSubjects.slice(0, showAll ? filteredSubjects.length : 5).map((subject) => (
//            <Tag
//             key={subject.subject_id}
//             color={selectedSubjects.includes(subject.subject_id) ? "blue" : "default"}
//             onClick={() => toggleSubject(subject.subject_id)}
//             className={styles.chip}
//           >
//             {subject.subject_description}
//           </Tag>
//         ))}
//       </div>

//        {/* Expand/Collapse Button */}
//       {filteredSubjects.length > 5 && (
//         <Tooltip title={showAll ? "Collapse" : "Expand"}>
//           <Button className={styles.down_button}>
//             <div className={styles.toggleButton} onClick={() => setShowAll(!showAll)}>
//               {showAll ? <UpOutlined /> : <DownOutlined />}
//             </div>
//           </Button>
//         </Tooltip>
//       )}


//       {/* Assigned Sections */}
//       <h3>Assigned Sections</h3>
//       <div className={styles.chipsContainer}>
//         {selectedSubjects.map((id) => {
//           const subject = subjects.find((sub) => sub.subject_id === id);
//           return subject ? (
//             <Tag key={id} color="blue" className={styles.chip} onClick={() => handleSubjectClick(id)}>
//               {subject.subject_description}
//             </Tag>
//           ) : null;
//         })}
//       </div>

//       {/* Topics Section */}
//       {selectedSubjectForTopics !== null && (
//         <div className={styles.topicContainer}>
//           <h3>Available Topics</h3>
//           {topicsLoading ? (
//             <Spin />
//           ) : (
//             <div className={styles.chipsContainer}>
//               {availableTopics.map((topic) => (
//                 <Tag key={topic.TOPIC_ID} color="green" className={styles.chip}>
//                   {topic.TOPIC_ID}
//                 </Tag>
//               ))}
//             </div>
//           )}

//           <h3>Assigned Topics</h3>
//           {topicsLoading ? (
//             <Spin />
//           ) : (
//             <div className={styles.chipsContainer}>
//               {assignedTopics.map((topic) => (
//                 <Tag key={topic.TOPIC_ID} color="blue" className={styles.chip}>
//                   {topic.TOPIC_ID} - {topic.question_count} Questions
//                   <Tooltip title="Edit">
//                     <span onClick={() => handleEditTopic(topic)} className={styles.editIcon}>✎</span>
//                   </Tooltip>
//                   <Tooltip title="Remove">
//                     <CloseCircleOutlined onClick={() => handleDeleteTopic(topic.TOPIC_ID)} className={styles.cancelIcon} />
//                   </Tooltip>
//                 </Tag>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Edit Topic Modal */}
//       <Modal title="Edit Topic" visible={isModalVisible} onOk={handleSaveTopic} onCancel={() => setIsModalVisible(false)}>
//         <Form form={form} layout="vertical">
//           <Form.Item label="Number of Questions" name="question_count" rules={[{ required: true }]}>
//             <InputNumber min={1} />
//           </Form.Item>
//           <Form.Item label="Duration (Minutes)" name="duration_min" rules={[{ required: true }]}>
//             <InputNumber min={1} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default AddSection;
























// import { useState, useEffect } from "react";
// import { Tag, Spin, Input, Tooltip, Button, Modal, Form, InputNumber, message, Select } from "antd";
// import { DownOutlined, SearchOutlined, UpOutlined, CloseCircleOutlined } from "@ant-design/icons";
// import axios from "axios";
// import styles from "@/assets/styles/evaluate/addSection.module.css"; 

// interface AddSectionProps {
//   testId: number;
// }

// const AssignSection: React.FC<AddSectionProps> = ({ testId }) => {
//   const [subjects, setSubjects] = useState<any[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
  

//   // Topics-related states
//   const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<number | null>(null);
//   const [availableTopics, setAvailableTopics] = useState<any[]>([]);
//   const [assignedTopics, setAssignedTopics] = useState<any[]>([]);
//   const [topicsLoading, setTopicsLoading] = useState(false);
//   const [topicsSearchTerm, setTopicsSearchTerm] = useState('');


//   // Modal states
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
//   const [form] = Form.useForm();
//   const [activeSubject, setActiveSubject] = useState();

  

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       try {
//         const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
//         const { data: testSubjects } = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);

//         const selectedIds = testSubjects.map((sub: any) => sub.subject_id);
//         setSubjects(allSubjects);
//         setSelectedSubjects(selectedIds);
//       } catch (error) {
//         console.error("Error fetching subjects:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubjects();
//   }, [testId]);
//   // State for Expand/Collapse
// const [showAllTopics, setShowAllTopics] = useState(false);


// // State for Selected Topics
// const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

// // Toggle Topic Selection
// const toggleTopicSelection = (topicId: number) => {
//   setSelectedTopics((prev) =>
//     prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
//   );
// };


//   const toggleSubject = (subjectId: number) => {
//     setSelectedSubjects((prev) =>
//       prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
//     );
//   };



// const handleSubjectClick = async (subjectId: number) => {
//     const isSameSubject = selectedSubjectForTopics === subjectId;
//     setSelectedSubjectForTopics(subjectId);

//     // if (isSameSubject) return; // Reset selection if the same tag is clicked

//     setTopicsLoading(true);
//     try {
//       const { data: topics } = await axios.get(`/api/evaluate/Admin/topics?subject_id=${subjectId}`);
//       setAvailableTopics(topics);

//       const { data: assigned } = await axios.get(
//         `/api/evaluate/Admin/assignedtopics?test_id=${testId}&subject_id=${subjectId}`
//       );
//       setAssignedTopics(assigned);
//     } catch (error) {
//       console.error("Error fetching topics:", error);
//     } finally {
//       setTopicsLoading(false);
//     }
//   };
//   const filteredSubjects = subjects.filter((subject) =>
//     subject.subject_description.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleEditTopic = (topic: any) => {
//     setSelectedTopic(topic);
//     form.setFieldsValue({
//       question_count: topic.question_count || 0,
//       duration_min: topic.duration_min || 0,
//     });
//     setIsModalVisible(true);
//   };

//   const handleSaveTopic = async () => {
//     try {
//       const values = await form.validateFields();
//       if (!selectedTopic) return;

//       await axios.post("/api/evaluate/Admin/assign-topic", {
//         test_id: testId,
//         subject_id: selectedSubjectForTopics,
//         topic_id: selectedTopic.TOPIC_ID,
//         question_count: values.question_count,
//         duration_min: values.duration_min,
//         rendering_order: values.rendering_order,
//       });

//       message.success("Topic updated successfully");
//       setIsModalVisible(false);
//       handleSubjectClick(selectedSubjectForTopics!);
//     } catch (error) {
//       console.error("Error updating topic:", error);
//       message.error("Failed to update topic");
//     }
//   };

  // const handleDeleteTopic = async (topicId: number) => {
  //   try {
  //     await axios.delete(`/api/evaluate/Admin/assign-topic?test_id=${testId}&topic_id=${topicId}`);
  
  //     message.success("Topic removed successfully");
  //     setAssignedTopics((prev) => prev.filter(topic => topic.TOPIC_ID !== topicId));
  //   } catch (error:any) {
  //     console.error("Error deleting topic:", error.response?.data || error);
  //     message.error("Failed to remove topic");
  //   }
  // };
  

//   if (loading) return <Spin />;

//   return (
//     <div className={styles.container}>
//       {/* Available Sections Header with Search */}
//       <div className={styles.header}>
//         <h3>Available Sections</h3>
//         <Input
//           placeholder="Search Sections..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//           prefix={<SearchOutlined className={styles.searchIcon} />}
//         />
//       </div>
      
//       {/* Chips Display */}
//       <div className={`${styles.chipsContainer} ${showAll ? styles.expanded : ""}`}>
//         {filteredSubjects.slice(0, showAll ? filteredSubjects.length : 5).map((subject) => (
//           <Tag
//             key={subject.subject_id}
//             color={selectedSubjects.includes(subject.subject_id) ? "blue" : "default"}
//             onClick={() => toggleSubject(subject.subject_id)}
//             className={styles.chip}
//           >
//             {subject.subject_description}
//           </Tag>
//         ))}
//       </div>

//       {/* Expand/Collapse Button */}
//       {filteredSubjects.length > 5 && (
//         <Tooltip title={showAll ? "Collapse" : "Expand"}>
//           <Button className={styles.down_button} onClick={() => setShowAll(!showAll)}>
//             {showAll ? <UpOutlined /> : <DownOutlined />}
//           </Button>
//         </Tooltip>
//       )}

//       {/* Assigned Sections */}
//       <h3>Assigned Sections</h3>
//       <div className={styles.chipsContainer}>
//         {selectedSubjects.map((id) => {
//           const subject = subjects.find((sub) => sub.subject_id === id);
//           return subject ? (
//             <Tag
//               key={id}
//               color={selectedSubjectForTopics === id ? "green" : "blue"}
//               className={styles.chip}
//               onClick={() => handleSubjectClick(id)}
//             >
//               {subject.subject_description}
//             </Tag>
//           ) : null;
//         })}
//       </div>

//       {/* Topics Section */}
//       {selectedSubjectForTopics !== null && (
//   <div className={styles.topicContainer}>
//     <div className={styles.topicHeaderContainer}>
//   <h3>Available Topics</h3>

//   <Input
//     placeholder="Search Topics..."
//     value={topicsSearchTerm}
//     onChange={(e) => setTopicsSearchTerm(e.target.value)}
//     className={styles.searchInput}
//     prefix={<SearchOutlined className={styles.searchIcon} />}
//   />
// </div>

//     {topicsLoading ? (
//       <Spin />
//     ) : (
//       <div className={`${styles.chipsContainer} ${showAllTopics ? styles.expanded : ""}`}>
//         {availableTopics
//           .filter((topic) =>
//             topic.TOPIC_ID.toLowerCase().includes(topicsSearchTerm.toLowerCase())
//           )
//           .slice(0, showAllTopics ? availableTopics.length : 5)
//           .map((topic) => (
//             <Tag
//               key={topic.TOPIC_ID}
//               color={assignedTopics.some((assigned) => assigned.TOPIC_ID === topic.TOPIC_ID) ? "blue" : "default"}
//               className={styles.chip}
//               onClick={() => handleEditTopic(topic)}
//             >
//               {topic.TOPIC_ID}
//             </Tag>
//           ))}
//       </div>
//     )}

//     {availableTopics.length > 5 && (
//       <Tooltip title={showAllTopics ? "Collapse" : "Expand"}>
//         <Button
//           className={styles.topics_down_button}
//           onClick={() => setShowAllTopics(!showAllTopics)}
//         >
//           {showAllTopics ? <UpOutlined /> : <DownOutlined />}
//         </Button>
//       </Tooltip>
//     )}

//     <h3>Assigned Topics</h3>
//     <div className={styles.chipsContainer}>
//       {assignedTopics.map((topic) => (
//         <Tag key={topic.TOPIC_ID} color="blue" className={styles.chip}>
//           <span onClick={() => handleEditTopic(topic)}>
//             {topic.TOPIC_ID} - {topic.question_count} Questions
//           </span>
//           <Tooltip title="Remove">
//             <CloseCircleOutlined
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDeleteTopic(topic.TOPIC_ID);
//               }}
//               className={styles.cancelIcon}
//             />
//           </Tooltip>
//         </Tag>
//       ))}
//     </div>
//   </div>
// )}


//  <Modal
//   title="Assign Topic"
//   open={isModalVisible}
//   onOk={handleSaveTopic}
//   onCancel={() => setIsModalVisible(false)}
// >
//   <Form form={form} layout="vertical">
//     <Form.Item
//       label="Number of Questions"
//       name="question_count"
//       rules={[{ required: true }]}
//     >
//       <InputNumber min={1} />
//     </Form.Item>
//     <Form.Item
//       label="Duration (Minutes)"
//       name="duration_min"
//       rules={[{ required: true }]}
//     >
//       <InputNumber min={1} />
//     </Form.Item>
//     <Form.Item
//       label="Rendering Order"
//       name="rendering_order"
//       rules={[{ required: true, message: 'Please select a rendering order' }]}
//     >
      // <Select placeholder="Select Rendering Order">
      //   {Array.from({ length: 10 }, (_, i) => ({
      //     label: `${["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"][i]}`,
      //     value: (i + 1) * 10,
      //   })).map(({ label, value }) => (
      //     <Select.Option key={value} value={value}>
      //       {label}
      //     </Select.Option>
      //   ))}
      // </Select>
//     </Form.Item>
//   </Form>
// </Modal> 

//     </div>
//   );
// };

// export default AssignSection;




































// import React, { useEffect, useState } from "react";
// import { Button, Table, Space, message, Modal, Checkbox, Spin, Tag, Tooltip } from "antd";
// import { PlusOutlined, DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
// import axios from "axios";

// interface SectionData {
//   subject_id: number;
//   subject_description: string;
//   subject_code: string;
// }

// interface TopicData {
//   TOPIC_ID: number;
//   question_count: number;
// }

// interface SubjectData {
//   subject_id: number;
//   subject_name: string;
//   subject_description: string;
// }

// const AssignSection = ({ testId }: { testId: number }) => {
//   const [sections, setSections] = useState<SectionData[]>([]);
//   const [topics, setTopics] = useState<{ [key: number]: TopicData[] }>({});
//   const [subjects, setSubjects] = useState<SubjectData[]>([]);
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (testId) {
//       fetchSectionData();
//     }
//   }, [testId]);

//   const fetchSectionData = async () => {
//     try {
//       const response = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);
//       setSections(response.data || []);
//       fetchAllTopics(response.data);
//     } catch (error) {
//       message.error("Failed to load section data");
//     }
//   };

//   const fetchAllTopics = async (sectionsData: SectionData[]) => {
//     try {
//       const topicPromises = sectionsData.map((section) =>
//         axios
//           .get(`/api/evaluate/Admin/assignedtopics?test_id=${testId}&subject_id=${section.subject_id}`)
//           .then((res) => ({ subject_id: section.subject_id, topics: res.data }))
//           .catch(() => ({ subject_id: section.subject_id, topics: [] }))
//       );

//       const topicResults = await Promise.all(topicPromises);
//       const topicsMap: { [key: number]: TopicData[] } = {};
//       topicResults.forEach((result) => {
//         topicsMap[result.subject_id] = result.topics;
//       });
//       setTopics(topicsMap);
//     } catch (error) {
//       message.error("Failed to fetch topics data");
//     }
//   };

//   const handleAssign = () => {
//     setIsModalOpen(true);
//     fetchSubjectsData();
//   };

//   const fetchSubjectsData = async () => {
//     setLoading(true);
//     try {
//       const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
//       setSubjects(allSubjects);
//       const selectedIds = sections.map((section) => section.subject_id);
//       setSelectedSubjects(selectedIds);
//     } catch (error) {
//       message.error("Error fetching subjects");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckboxChange = async (subject: SubjectData, checked: boolean) => {
//     if (checked) {
//       setSelectedSubjects((prev) => [...prev, subject.subject_id]);
//       setSections((prev) => [
//         ...prev,
//         {
//           subject_id: subject.subject_id,
//           subject_description: subject.subject_description,
//           subject_code: "",
//         },
//       ]);
//     } else {
//       try {
//         await axios.delete(`/api/evaluate/Admin/addsection`, {
//           data: { test_id: testId, subject_id: subject.subject_id },
//         });
//         setSelectedSubjects((prev) => prev.filter((id) => id !== subject.subject_id));
//         setSections((prev) => prev.filter((section) => section.subject_id !== subject.subject_id));
//         message.success("Subject removed successfully");
//       } catch (error) {
//         message.error("Failed to remove subject");
//       }
//     }
//   };

//   const columns = [
//     {
//       title: "Section (Subject Description)",
//       dataIndex: "subject_description",
//       key: "subject_description",
//     },
//     {
//       title: "Topics (Topic IDs)",
//       key: "TOPIC_ID",
//       render: (_: any, record: SectionData) => {
//         const topicList = topics[record.subject_id] || [];
//         return (
//           <Space wrap>
//             {topicList.map((topic) => (
//               <Tag key={topic.TOPIC_ID} closable>
//                 {topic.TOPIC_ID}
//               </Tag>
//             ))}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: any, record: SectionData) => (
//         <Space>
//           <Tooltip title="Assign Topic">
//             <PlusCircleOutlined style={{ color: "green" }} />
//           </Tooltip>
//           <Tooltip title="Delete Subject">
//             <DeleteOutlined style={{ color: "red" }} />
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div>
//       <Space style={{ marginBottom: 16 }}>
//         <Button type="primary" icon={<PlusOutlined />} onClick={handleAssign}>
//           Assign Section
//         </Button>
//       </Space>

//       <Table dataSource={sections} columns={columns} rowKey="subject_id" />

//       <Modal
//         title="Assign Subjects"
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         footer={<Button onClick={() => setIsModalOpen(false)}>Done</Button>}
//       >
//         {loading ? (
//           <Spin />
//         ) : (
//           <div>
//             {subjects.map((subject) => (
//               <Checkbox
//                 key={subject.subject_id}
//                 checked={selectedSubjects.includes(subject.subject_id)}
//                 onChange={(e) => handleCheckboxChange(subject, e.target.checked)}
//               >
//                 {subject.subject_description}
//               </Checkbox>
//             ))}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default AssignSection;
















import React, { useEffect, useState } from "react";
import { Button, Table, Space, message, Modal, Checkbox, Spin, Tag, Tooltip, Form, InputNumber, Select, Input } from "antd";
import { PlusOutlined, DeleteOutlined, PlusCircleOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";
import { AnyAaaaRecord } from "dns";
import { AnyComponent } from "@fullcalendar/core/preact.js";

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

const AssignSection = ({ testId }: { testId: number }) => {
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
 const [isFormModalOpen, setIsFormModalOpen] = useState(false);
 const [form] = Form.useForm();
 const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  useEffect(() => {
    if (testId) {
      fetchSectionData();
    }
  }, [testId]);

  const fetchSectionData = async () => {
    try {
      const response = await axios.get(`/api/evaluate/Admin/testsubjects?test_id=${testId}`);
      setSections(response.data || []);
      fetchAllTopics(response.data);
    } catch (error) {
      message.error("Failed to load section data");
    }
  };

  const fetchAllTopics = async (sectionsData: SectionData[]) => {
    try {
      const topicPromises = sectionsData.map((section) =>
        axios
          .get(`/api/evaluate/Admin/assignedtopics?test_id=${testId}&subject_id=${section.subject_id}`)
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
      // const { data: allSubjects } = await axios.get("/api/evaluate/Admin/subjects");
      const { data: allSubjects } = await axios.get("/api/evaluate/Admin/assigned-sections");
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
        await axios.delete(`/api/evaluate/Admin/addsection`, {
          data: { test_id: testId, subject_id: subject.subject_id },
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
      await axios.delete(`/api/evaluate/Admin/addsection`, {
        data: { test_id: testId, subject_id: subject.subject_id },
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
  // const handleAssignTopic = async (subjectId: number) => {
  //   setSelectedSubjectId(subjectId);
  //   setIsTopicModalOpen(true);

  //   try {
  //     const { data } = await axios.get(`/api/evaluate/Admin/get-subject-topics?subject_id=${subjectId}`);
  //     console.log('dataaaaa',data)
  //     setAvailableTopics(data.topics);

  //     // Fetch already assigned topics
  //     const assignedTopics = topics[subjectId]?.map((t) => t.TOPIC_ID) || [];
  //     setSelectedTopics(assignedTopics);
  //   } catch (error) {
  //     message.error("Failed to fetch topics for the subject");
  //   }
  // };
  const handleAssignTopic = async (subjectId: number) => {
    setSelectedSubjectId(subjectId);
    setIsTopicModalOpen(true);

    try {
      const { data } = await axios.get(`/api/evaluate/Admin/get-subject-topics?subject_id=${subjectId}`);
      console.log('API Response:', data); // Check what is actually returned

      // Ensure the response is an array
      setAvailableTopics(Array.isArray(data) ? data : []);

      // Fetch already assigned topics
      const assignedTopics = topics[subjectId]?.map((t) => t.TOPIC_ID) || [];
      setSelectedTopics(assignedTopics);
    } catch (error) {
      message.error("Failed to fetch topics for the subject");
    }
};


  const handleDeleteTopic = async (topicId: string) => {
    try {
      await fetch(`/api/evaluate/Admin/assign-topic?test_id=${testId}&topic_id=${topicId}`, {
        method: 'DELETE',
      });
      setSelectedTopics((prev) => prev.filter((id:any) => id !== topicId));
      await fetchAllTopics(sections);
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };
  
  const handleTopicSelect = async (topicId: number, checked: boolean) => {
    if (checked) {
      setSelectedTopics((prev) => [...prev, topicId]);
      setCurrentTopicId(topicId);
      setIsFormModalOpen(true);
      setIsTopicModalOpen(false)
      await fetchAllTopics(sections);
    } else {
      try {
        await handleDeleteTopic(topicId.toString());
        setSelectedTopics((prev) => prev.filter((id) => id !== topicId));
      } catch (error) {
        console.error('Failed to delete topic on close:', error);
      }
    }
  };
  
  // Handle form submit
  const handleSaveTopic = async () => {
    try {
      const values = await form.validateFields();
      await axios.post("/api/evaluate/Admin/assign-topic", {
        test_id: testId,
        subject_id: selectedSubjectId,
        topic_id: currentTopicId,
        ...values,
      });
      message.success("Topic assigned successfully");
      setIsFormModalOpen(false);
      await fetchAllTopics(sections);
      form.resetFields();
    } catch (error) {
      message.error("Failed to assign topic");
    }
  };
  
  const renderingOptions = [
    { label: "First", value: 10 },
    { label: "Second", value: 20 },
    { label: "Third", value: 30 },
    { label: "Fourth", value: 40 },
    { label: "Fifth", value: 50 },
    { label: "Sixth", value: 60 },
    { label: "Seventh", value: 70 },
    { label: "Eighth", value: 80 },
    { label: "Ninth", value: 90 },
    { label: "Tenth", value: 100 },
  ];
  
  const handleUpdateRenderingOrder = async (subject_id:any, test_id:any, newOrder:any) => {
    const response = await fetch("/api/evaluate/Admin/update-rendering-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id, test_id, rendering_order: newOrder }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to update rendering order");
    }
  };
  const handleEditTopic = (subjectId: any, topic: any) => {
  //   if (selectedSubjectId != subjectId) {
  //     setSelectedSubjectId(subjectId); 
  // }
    setCurrentTopicId(topic.TOPIC_ID);
    form.setFieldsValue({
      question_count: topic.question_count,
      complexity: topic.complexity||null,
    });
    setIsFormModalOpen(true);
  };
  
  // const handleUpdateDuration = async (subject_id: any, test_id: any, newDuration: any) => {
  //   const response = await fetch("/api/evaluate/Admin/update-duration", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ subject_id, test_id, duration: newDuration }),
  //   });
  
  //   if (!response.ok) {
  //     throw new Error("Failed to update duration");
  //   }
  // };
  
  const handleUpdateDuration = async (
    subject_id: any,
    test_id: any,
    newDuration: number
  ) => {
    const response = await fetch("/api/evaluate/Admin/update-duration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id, test_id, duration: newDuration }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to update duration");
    }
  };

  const modalColumns = [
    // {
    //   title: "Actions",
    //   key: "actions",
    //   render: (_: any, record: any) => (
    //     <Button onClick={() => handleTopicSelect(record.TOPIC_ID, true)}> edit</Button>
        
    //   ),
    // },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Edit Topic">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "blue" }} />}
              onClick={() => handleEditTopic(record.subject_id, record)}
            />
          </Tooltip>
          <Tooltip title="Delete Topic">
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "red" }} />}
              onClick={() => handleDeleteTopic(record.TOPIC_ID)}
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
    {
      title: "Question Count",
      dataIndex: "question_count",
      key: "question_count",
    },
    {
      title: "Complexity",
      dataIndex: "complexity",
      key: "complexity",
      render: (complexity: number | null) => {
          switch (complexity) {
              case 1:
                  return "Easy";
              case 2:
                  return "Medium";
              case 3:
                  return "Hard";
              default:
                  return "None";
          }
      },
  }
  
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

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SectionData) => (
        <Space>
          <Tooltip title="Assign Topic">
            <PlusCircleOutlined style={{ color: "green" }}
            onClick={() => handleOpenModal(record.subject_id,record.subject_description)}
            //  onClick={() => handleAssignTopic(record.subject_id)}
              />
          </Tooltip>
          <Tooltip title="Delete Subject">
            <DeleteOutlined style={{ color: "red" }} onClick={() => handleDeleteSubject(record)} />

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
      title: "Duration (Min)",
      key: "duration_min",
      render: (_: any, record: SectionData) => {
        const topicList = topics[record.subject_id] || [];
        const currentDuration = topicList.length > 0 ? topicList[0].duration_min : null;
    
        const handleDurationChange = async (newDuration: number | null) => {
          if (newDuration === null) return; // Prevent null values from being processed
    
          try {
            await handleUpdateDuration(record.subject_id, testId, newDuration);
            message.success("Duration updated successfully.");
    
            // Update the topics state to reflect the new duration
            setTopics((prevTopics) => ({
              ...prevTopics,
              [record.subject_id]: prevTopics[record.subject_id].map((topic) => ({
                ...topic,
                duration_min: newDuration,
              })),
            }));
          } catch (error) {
            message.error("Failed to update duration.");
          }
        };
    
        return (
          <InputNumber
            min={0}
            value={currentDuration}
            onChange={handleDurationChange}
            disabled={topicList.length === 0}
            style={{ width: 100 }}
          />
        );
      },
    },
    {
      title: "Rendering Order",
      key: "rendering_order",
      render: (_: any, record: SectionData) => {
        const topicList = topics[record.subject_id] || [];
        const currentOrder = topicList.length > 0 ? topicList[0].rendering_order : null;
    
        const handleChange = async (newOrder: any) => {
          try {
            await handleUpdateRenderingOrder(record.subject_id, testId, newOrder);
            message.success("Rendering order updated successfully.");
            
            // Update the topics state to reflect the new rendering order
            setTopics((prevTopics) => ({
              ...prevTopics,
              [record.subject_id]: prevTopics[record.subject_id].map((topic) => ({
                ...topic,
                rendering_order: newOrder,
              })),
            }));
          } catch (error) {
            message.error("Failed to update rendering order.");
          }
        };
    
        return (
          <Select
            placeholder="Select Rendering Order"
            value={currentOrder}
            onChange={handleChange}
            disabled={topicList.length === 0}
            style={{ width: 150 }}
          >
            {renderingOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },    
    {
      title: "Topics",
      key: "TOPIC_ID",
      render: (_: any, record: SectionData) => {
        const topicList = topics[record.subject_id] || [];
        return (
          <Space wrap>
            {topicList.map((topic) => (
              <Tag key={topic.TOPIC_ID} closable onClose={() => handleTopicSelect(topic.TOPIC_ID, false)} onClick={() => handleEditTopic(record.subject_id, topic)}>
                {topic.TOPIC_ID}-{topic.question_count}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    
  ];

  return (
    <div>
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
            {subjects.map((subject) => (
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

      {/* Form Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="text-lg font-bold">Topic Details</span>
            {currentTopicId && (
              <span className="ml-2 text-sm text-gray-500">
                (topic:{currentTopicId})
              </span>
            )}
          </div>
        }
        open={isFormModalOpen}
        onOk={handleSaveTopic}
        onCancel={() => setIsFormModalOpen(false)}
      >
        
        <Form form={form} layout="vertical" >
        {/* initialValues={{ complexity: null }} */}
          <Form.Item
            label="Number of Questions"
            name="question_count"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          
          <Form.Item
      label="Complexity"
      name="complexity"
      rules={[{ required: false, message: 'Please select complexity of the topic' }]}
    >
      <Select placeholder="Select Complexity of the Topic">
      <Select.Option value={null}>None</Select.Option>
    <Select.Option value={1}>Easy</Select.Option>
    <Select.Option value={2}>Medium</Select.Option>
    <Select.Option value={3}>Hard</Select.Option>
  </Select>
    </Form.Item>
        </Form>
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
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  );
};

export default AssignSection;










