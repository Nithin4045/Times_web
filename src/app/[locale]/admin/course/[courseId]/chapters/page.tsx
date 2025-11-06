// // src/app/[locale]/admin/course/[courseId]/chapters/page.tsx
// "use client";

// import React, { useCallback, useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Typography, Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm,
// } from "antd";

// const { Title } = Typography;

// export default function CourseChaptersPage() {
//   const params: any = useParams();
//   const router = useRouter();
//   const courseId = Number(params.courseId);

//   const [loading, setLoading] = useState(false);
//   const [chapters, setChapters] = useState<any[]>([]);
//   const [course, setCourse] = useState<any>(null);

//   // chapter modal
//   const [chapterModalOpen, setChapterModalOpen] = useState(false);
//   const [chapterEditing, setChapterEditing] = useState<any | null>(null);
//   const [chapterForm] = Form.useForm();

//   // topic modal
//   const [topicModalOpen, setTopicModalOpen] = useState(false);
//   const [topicEditing, setTopicEditing] = useState<any | null>(null);
//   const [currentChapterForTopic, setCurrentChapterForTopic] = useState<any | null>(null);
//   const [topicForm] = Form.useForm();

//   const load = useCallback(async () => {
//     if (!courseId || Number.isNaN(courseId)) {
//       message.error("Invalid course id");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Fetch chapters for this specific course and all courses to get course details
//       console.log(`Loading chapters for course ${courseId}`);
//       const [chapRes, coursesRes] = await Promise.all([
//         fetch(`/api/admin/course_chapters?course_id=${courseId}`, { cache: "no-store" }),
//         fetch(`/api/admin/courses`, { cache: "no-store" }),
//       ]);

//       const chapJson = await chapRes.json().catch(() => ({}));
//       const coursesJson = await coursesRes.json().catch(() => ({}));

//       if (!chapRes.ok || chapJson?.success !== true) {
//         throw new Error(chapJson?.error || "Failed to load chapters");
//       }

//       // Find the specific course details from the courses list
//       const coursesList = Array.isArray(coursesJson?.data) ? coursesJson.data : [];
//       const foundCourse = coursesList.find((c: any) => c.id === courseId) ?? null;
//       setCourse(foundCourse);

//       // Set chapters data - should already include expanded topics from API
//       const chaptersData = Array.isArray(chapJson.data) ? chapJson.data : [];
//       setChapters(chaptersData);

//       console.log("Loaded chapters:", chaptersData);
//       console.log("Found course:", foundCourse);

//       if (chapJson.debug) {
//         console.log("Debug info:", chapJson.debug);
//       }

//     } catch (e: any) {
//       console.error("Error loading chapters:", e);
//       message.error(e?.message || "Failed to load chapters");
//     } finally {
//       setLoading(false);
//     }
//   }, [courseId]);

//   useEffect(() => { 
//     load(); 
//   }, [load]);

//   // open add chapter
//   const openAddChapter = () => {
//     setChapterEditing(null);
//     chapterForm.resetFields();
//     chapterForm.setFieldsValue({ order: 0, title: "" });
//     setChapterModalOpen(true);
//   };

//   const openEditChapter = (rec: any) => {
//     setChapterEditing(rec);
//     chapterForm.setFieldsValue({
//       title: rec.title,
//       description: rec.description,
//       order: rec.order,
//       isactive: rec.isactive,
//     });
//     setChapterModalOpen(true);
//   };

//   const submitChapter = async () => {
//     try {
//       const vals = await chapterForm.validateFields();
//       const payload: any = {
//         title: vals.title,
//         description: vals.description ?? null,
//         order: vals.order ?? 0,
//         course_id: courseId, // store as single course id; backend will put it into array
//       };

//       if (chapterEditing) {
//         payload.id = chapterEditing.id;
//         const res = await fetch("/api/admin/course_chapters", { 
//           method: "PUT", 
//           headers: { "Content-Type": "application/json" }, 
//           body: JSON.stringify(payload) 
//         });
//         const j = await res.json().catch(() => ({}));
//         if (!res.ok || j?.success !== true) throw new Error(j?.error || "Update failed");
//         message.success("Chapter updated");
//       } else {
//         const res = await fetch("/api/admin/course_chapters", { 
//           method: "POST", 
//           body: JSON.stringify(payload), 
//           headers: { "Content-Type": "application/json" } 
//         });
//         const j = await res.json().catch(() => ({}));
//         if (!res.ok || j?.success !== true) throw new Error(j?.error || "Create failed");
//         message.success("Chapter added");
//       }
//       setChapterModalOpen(false);
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed");
//     }
//   };

//   const deleteChapter = async (id: number) => {
//     try {
//       const res = await fetch(`/api/admin/course_chapters?id=${id}`, { method: "DELETE" });
//       const j = await res.json().catch(() => ({}));
//       if (!res.ok || j?.success !== true) throw new Error(j?.error || "Delete failed");
//       message.success("Chapter deleted");
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to delete");
//     }
//   };

//   // Topics: open modal to add topic under chapter
//   const openAddTopic = (chapter: any) => {
//     setCurrentChapterForTopic(chapter);
//     setTopicEditing(null);
//     topicForm.resetFields();
//     topicForm.setFieldsValue({ topic_name: "", order: 0, type: "paid" });
//     setTopicModalOpen(true);
//   };

//   const submitTopic = async () => {
//     try {
//       const vals = await topicForm.validateFields();

//       // 1) create topic
//       const payloadTopic: any = {
//         topic_name: vals.topic_name,
//         order: vals.order ?? 0,
//         type: vals.type ?? "paid",
//       };

//       const resTopic = await fetch("/api/admin/course_topics", { 
//         method: "POST", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify(payloadTopic) 
//       });
//       const jTopic = await resTopic.json().catch(() => ({}));
//       if (!resTopic.ok || jTopic?.success !== true) {
//         throw new Error(jTopic?.error || "Topic create failed");
//       }

//       const topicId = jTopic.data?.id;

//       // 2) append topicId to chapter's course_topic_id array: fetch existing array, push and update
//       const chap = currentChapterForTopic;
//       const newTopicIds = Array.isArray(chap.course_topic_id) ? [...chap.course_topic_id, topicId] : [topicId];

//       const resUpdate = await fetch("/api/admin/course_chapters", { 
//         method: "PUT", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify({ 
//           id: chap.id, 
//           course_topic_id: newTopicIds 
//         }) 
//       });
//       const jUp = await resUpdate.json().catch(() => ({}));
//       if (!resUpdate.ok || jUp?.success !== true) {
//         throw new Error(jUp?.error || "Failed to attach topic to chapter");
//       }

//       message.success("Topic added");
//       setTopicModalOpen(false);
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to add topic");
//     }
//   };

//   const deleteTopic = async (topicId: number, chapter: any) => {
//     try {
//       // delete topic row
//       const res = await fetch(`/api/admin/course_topics?id=${topicId}`, { method: "DELETE" });
//       const j = await res.json().catch(() => ({}));
//       if (!res.ok || j?.success !== true) throw new Error(j?.error || "Failed to delete topic");

//       // remove reference from chapter
//       const newIds = (chapter.course_topic_id || []).filter((x: number) => x !== topicId);
//       const r2 = await fetch("/api/admin/course_chapters", { 
//         method: "PUT", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify({ 
//           id: chapter.id, 
//           course_topic_id: newIds 
//         }) 
//       });
//       const j2 = await r2.json().catch(() => ({}));
//       if (!r2.ok || j2?.success !== true) {
//         throw new Error(j2?.error || "Failed to update chapter after deleting topic");
//       }

//       message.success("Topic deleted");
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to delete topic");
//     }
//   };

//   const columns = [
//     { 
//       title: "Title", 
//       dataIndex: "title", 
//       key: "title",
//       render: (text: string, record: any) => (
//         <div>
//           <strong>{text}</strong>
//           {/* {record.description && (
//             <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
//               {record.description}
//             </div>
//           )} */}
//         </div>
//       )
//     },
//     { title: "Order", dataIndex: "order", key: "order", width: 100 },
//     { 
//       title: "Topics", 
//       key: "topics", 
//       render: (_v: any, rec: any) => (
//         <div>
//           {rec.topics?.length ? (
//             <ul style={{ margin: 0, paddingLeft: 16 }}>
//               {rec.topics.map((t: any) => (
//                 <li key={t.id}>
//                   <strong>{t.topic_name}</strong> &nbsp; 
//                   <small>({t.type}) - Order: {t.order}</small>
//                   <Popconfirm 
//                     title="Delete topic?" 
//                     onConfirm={() => deleteTopic(t.id, rec)} 
//                     okText="Delete" 
//                     okButtonProps={{ danger: true }}
//                   >
//                     <Button size="small" danger style={{ marginLeft: 8 }}>
//                       Delete
//                     </Button>
//                   </Popconfirm>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <span style={{ color: '#999' }}>No topics</span>
//           )}
//         </div>
//       )
//     },
//     { 
//       title: "Actions", 
//       key: "actions", 
//       render: (_v: any, rec: any) => (
//         <Space>
//           <Button size="small" onClick={() => openEditChapter(rec)}>
//             Edit
//           </Button>
//           <Popconfirm 
//             title="Delete chapter?" 
//             onConfirm={() => deleteChapter(rec.id)} 
//             okText="Delete" 
//             okButtonProps={{ danger: true }}
//           >
//             <Button size="small" danger>Delete</Button>
//           </Popconfirm>
//           <Button size="small" onClick={() => openAddTopic(rec)}>
//             Add Topic
//           </Button>
//         </Space>
//       )
//     },
//   ];

//   return (
//     <div style={{ padding: 16 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <Title level={4}>
//           Chapters for Course: {course?.coursename || `#${courseId}`}
//         </Title>
//         <Space>
//           <Button onClick={() => router.back()}>Back</Button>
//           <Button type="primary" onClick={openAddChapter}>Add Chapter</Button>
//         </Space>
//       </div>

//       {course && (
//         <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
//           <strong>Course Details:</strong> {course.coursename} | 
//           Price: {course.price} | 
//           Type: {course.type} | 
//           Active: {course.active ? 'Yes' : 'No'}
//         </div>
//       )}

//       <Table 
//         rowKey="id" 
//         dataSource={chapters} 
//         columns={columns} 
//         loading={loading} 
//         pagination={{ pageSize: 10, showSizeChanger: true }}
//         expandable={{
//           expandedRowRender: (record) => (
//             <div style={{ padding: 16 }}>
//               <p><strong>Description:</strong> {record.description || 'No description'}</p>
//               <p><strong>Active:</strong> {record.isactive ? 'Yes' : 'No'}</p>
//               <p><strong>Created:</strong> {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}</p>
//               <p><strong>Updated:</strong> {record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}</p>
//             </div>
//           ),
//         }}
//       />

//       {/* Chapter Modal */}
//       <Modal 
//         title={chapterEditing ? "Edit Chapter" : "Add Chapter"} 
//         open={chapterModalOpen} 
//         onCancel={() => setChapterModalOpen(false)} 
//         onOk={submitChapter}
//       >
//         <Form form={chapterForm} layout="vertical">
//           <Form.Item name="title" label="Title" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="description" label="Description">
//             <Input.TextArea />
//           </Form.Item>
//           <Form.Item name="order" label="Order">
//             <InputNumber min={0} style={{ width: "100%" }} />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Topic Modal */}
//       <Modal 
//         title="Add Topic" 
//         open={topicModalOpen} 
//         onCancel={() => setTopicModalOpen(false)} 
//         onOk={submitTopic}
//       >
//         <Form form={topicForm} layout="vertical">
//           <Form.Item name="topic_name" label="Topic Name" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="order" label="Order">
//             <InputNumber min={0} style={{ width: "100%" }} />
//           </Form.Item>
//           <Form.Item name="type" label="Type" initialValue="paid" rules={[{ required: true }]}>
//             <Select options={[
//               { label: "Paid", value: "paid" }, 
//               { label: "Free", value: "free" }
//             ]} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }




















// // src/app/[locale]/admin/course/[courseId]/chapters/page.tsx

// "use client";

// import React, { useCallback, useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Typography, Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tooltip,
// } from "antd";
// import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
// import styles from "./page.module.css";

// const { Title } = Typography;

// export default function CourseChaptersPage() {
//   const params: any = useParams();
//   const router = useRouter();
//   const courseId = Number(params.courseId);

//   const [loading, setLoading] = useState(false);
//   const [chapters, setChapters] = useState<any[]>([]);
//   const [course, setCourse] = useState<any>(null);

//   // chapter modal
//   const [chapterModalOpen, setChapterModalOpen] = useState(false);
//   const [chapterEditing, setChapterEditing] = useState<any | null>(null);
//   const [chapterForm] = Form.useForm();

//   // topic modal
//   const [topicModalOpen, setTopicModalOpen] = useState(false);
//   const [topicEditing, setTopicEditing] = useState<any | null>(null);
//   const [currentChapterForTopic, setCurrentChapterForTopic] = useState<any | null>(null);
//   const [topicForm] = Form.useForm();

//   const load = useCallback(async () => {
//     if (!courseId || Number.isNaN(courseId)) {
//       message.error("Invalid course id");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Fetch chapters for this specific course and all courses to get course details
//       console.log(`Loading chapters for course ${courseId}`);
//       const [chapRes, coursesRes] = await Promise.all([
//         fetch(`/api/admin/course_chapters?course_id=${courseId}`, { cache: "no-store" }),
//         fetch(`/api/admin/courses`, { cache: "no-store" }),
//       ]);

//       const chapJson = await chapRes.json().catch(() => ({}));
//       const coursesJson = await coursesRes.json().catch(() => ({}));

//       if (!chapRes.ok || chapJson?.success !== true) {
//         throw new Error(chapJson?.error || "Failed to load chapters");
//       }

//       // Find the specific course details from the courses list
//       const coursesList = Array.isArray(coursesJson?.data) ? coursesJson.data : [];
//       const foundCourse = coursesList.find((c: any) => c.id === courseId) ?? null;
//       setCourse(foundCourse);

//       // Set chapters data - should already include expanded topics from API
//       const chaptersData = Array.isArray(chapJson.data) ? chapJson.data : [];
//       setChapters(chaptersData);

//       console.log("Loaded chapters:", chaptersData);
//       console.log("Found course:", foundCourse);

//       if (chapJson.debug) {
//         console.log("Debug info:", chapJson.debug);
//       }

//     } catch (e: any) {
//       console.error("Error loading chapters:", e);
//       message.error(e?.message || "Failed to load chapters");
//     } finally {
//       setLoading(false);
//     }
//   }, [courseId]);

//   useEffect(() => { 
//     load(); 
//   }, [load]);

//   // open add chapter
//   const openAddChapter = () => {
//     setChapterEditing(null);
//     chapterForm.resetFields();
//     chapterForm.setFieldsValue({ order: 0, title: "" });
//     setChapterModalOpen(true);
//   };

//   const openEditChapter = (rec: any) => {
//     setChapterEditing(rec);
//     chapterForm.setFieldsValue({
//       title: rec.title,
//       description: rec.description,
//       order: rec.order,
//       isactive: rec.isactive,
//     });
//     setChapterModalOpen(true);
//   };

//   const submitChapter = async () => {
//     try {
//       const vals = await chapterForm.validateFields();
//       const payload: any = {
//         title: vals.title,
//         description: vals.description ?? null,
//         order: vals.order ?? 0,
//         course_id: courseId, // store as single course id; backend will put it into array
//       };

//       if (chapterEditing) {
//         payload.id = chapterEditing.id;
//         const res = await fetch("/api/admin/course_chapters", { 
//           method: "PUT", 
//           headers: { "Content-Type": "application/json" }, 
//           body: JSON.stringify(payload) 
//         });
//         const j = await res.json().catch(() => ({}));
//         if (!res.ok || j?.success !== true) throw new Error(j?.error || "Update failed");
//         message.success("Chapter updated");
//       } else {
//         const res = await fetch("/api/admin/course_chapters", { 
//           method: "POST", 
//           body: JSON.stringify(payload), 
//           headers: { "Content-Type": "application/json" } 
//         });
//         const j = await res.json().catch(() => ({}));
//         if (!res.ok || j?.success !== true) throw new Error(j?.error || "Create failed");
//         message.success("Chapter added");
//       }
//       setChapterModalOpen(false);
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed");
//     }
//   };

//   const deleteChapter = async (id: number) => {
//     try {
//       const res = await fetch(`/api/admin/course_chapters?id=${id}`, { method: "DELETE" });
//       const j = await res.json().catch(() => ({}));
//       if (!res.ok || j?.success !== true) throw new Error(j?.error || "Delete failed");
//       message.success("Chapter deleted");
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to delete");
//     }
//   };

//   // Topics: open modal to add topic under chapter
//   const openAddTopic = (chapter: any) => {
//     setCurrentChapterForTopic(chapter);
//     setTopicEditing(null);
//     topicForm.resetFields();
//     topicForm.setFieldsValue({ topic_name: "", order: 0, type: "paid" });
//     setTopicModalOpen(true);
//   };

//   const submitTopic = async () => {
//     try {
//       const vals = await topicForm.validateFields();

//       // 1) create topic
//       const payloadTopic: any = {
//         topic_name: vals.topic_name,
//         order: vals.order ?? 0,
//         type: vals.type ?? "paid",
//       };

//       const resTopic = await fetch("/api/admin/course_topics", { 
//         method: "POST", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify(payloadTopic) 
//       });
//       const jTopic = await resTopic.json().catch(() => ({}));
//       if (!resTopic.ok || jTopic?.success !== true) {
//         throw new Error(jTopic?.error || "Topic create failed");
//       }

//       const topicId = jTopic.data?.id;

//       // 2) append topicId to chapter's course_topic_id array: fetch existing array, push and update
//       const chap = currentChapterForTopic;
//       const newTopicIds = Array.isArray(chap.course_topic_id) ? [...chap.course_topic_id, topicId] : [topicId];

//       const resUpdate = await fetch("/api/admin/course_chapters", { 
//         method: "PUT", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify({ 
//           id: chap.id, 
//           course_topic_id: newTopicIds 
//         }) 
//       });
//       const jUp = await resUpdate.json().catch(() => ({}));
//       if (!resUpdate.ok || jUp?.success !== true) {
//         throw new Error(jUp?.error || "Failed to attach topic to chapter");
//       }

//       message.success("Topic added");
//       setTopicModalOpen(false);
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to add topic");
//     }
//   };

//   const deleteTopic = async (topicId: number, chapter: any) => {
//     try {
//       // delete topic row
//       const res = await fetch(`/api/admin/course_topics?id=${topicId}`, { method: "DELETE" });
//       const j = await res.json().catch(() => ({}));
//       if (!res.ok || j?.success !== true) throw new Error(j?.error || "Failed to delete topic");

//       // remove reference from chapter
//       const newIds = (chapter.course_topic_id || []).filter((x: number) => x !== topicId);
//       const r2 = await fetch("/api/admin/course_chapters", { 
//         method: "PUT", 
//         headers: { "Content-Type": "application/json" }, 
//         body: JSON.stringify({ 
//           id: chapter.id, 
//           course_topic_id: newIds 
//         }) 
//       });
//       const j2 = await r2.json().catch(() => ({}));
//       if (!r2.ok || j2?.success !== true) {
//         throw new Error(j2?.error || "Failed to update chapter after deleting topic");
//       }

//       message.success("Topic deleted");
//       load();
//     } catch (e: any) {
//       message.error(e?.message ?? "Failed to delete topic");
//     }
//   };

//   const columns = [
//     { 
//       title: "Title", 
//       dataIndex: "title", 
//       key: "title",
//       render: (text: string) => <div className={styles.titleCell}><strong>{text}</strong></div>,
//     },
//     { title: "Order", dataIndex: "order", key: "order", width: 100, className: styles.centerCell },
//     { 
//       title: "Topics", 
//       key: "topics",
//       render: (_v: any, rec: any) => (
//         <div className={styles.topicsWrapper}>
//           {rec.topics?.length ? (
//             rec.topics.map((t: any) => (
//               <div key={t.id} className={styles.topicRow}>
//                 <div className={styles.topicName}><strong>{t.topic_name}</strong></div>
//                 <div className={styles.topicType}><Tooltip title={t.type}><span className={styles.typeTag}>{t.type}</span></Tooltip></div>
//                 <div className={styles.topicOrder}>Order: {t.order}</div>
//                 <div className={styles.topicAction}>
//                   <Popconfirm title="Delete topic?" onConfirm={() => deleteTopic(t.id, rec)} okText="Delete" okButtonProps={{ danger: true }}>
//                     <Button type="text" icon={<DeleteOutlined />} aria-label="Delete topic" />
//                   </Popconfirm>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <span style={{ color: '#999' }}>No topics</span>
//           )}
//         </div>
//       )
//     },
//     { 
//       title: "Actions", 
//       key: "actions",
//       width: 140,
//       render: (_v: any, rec: any) => (
//         <Space>
//           <Tooltip title="Edit chapter">
//             <Button type="text" icon={<EditOutlined />} onClick={() => openEditChapter(rec)} />
//           </Tooltip>
//           <Tooltip title="Delete chapter">
//             <Popconfirm title="Delete chapter?" onConfirm={() => deleteChapter(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
//               <Button type="text" icon={<DeleteOutlined />} danger />
//             </Popconfirm>
//           </Tooltip>
//           <Button size="small" onClick={() => openAddTopic(rec)} icon={<PlusOutlined />}>Add Topic</Button>
//         </Space>
//       )
//     },
//   ];

//   return (
//     <div className={styles.container}>
//       <div className={styles.header}>
//         <Title level={4}>Chapters for Course: {course?.coursename || `#${courseId}`}</Title>
//         <Space>
//           <Button onClick={() => router.back()}>Back</Button>
//           <Button type="primary" onClick={openAddChapter}>Add Chapter</Button>
//         </Space>
//       </div>

//       {course && (
//         <div className={styles.courseCard}>
//           <strong>Course Details:</strong> {course.coursename} &nbsp; | &nbsp; Price: {course.price} &nbsp; | &nbsp; Type: {course.type} &nbsp; | &nbsp; Active: {course.active ? 'Yes' : 'No'}
//         </div>
//       )}

//       <Table 
//         rowKey="id" 
//         dataSource={chapters} 
//         columns={columns} 
//         loading={loading} 
//         pagination={{ pageSize: 10, showSizeChanger: true }}
//         className={styles.table}
//         expandable={{
//           expandedRowRender: (record) => (
//             <div style={{ padding: 16 }}>
//               <p><strong>Description:</strong> {record.description || 'No description'}</p>
//               <p><strong>Active:</strong> {record.isactive ? 'Yes' : 'No'}</p>
//               <p><strong>Created:</strong> {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}</p>
//               <p><strong>Updated:</strong> {record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}</p>
//             </div>
//           ),
//         }}
//       />

//       {/* Chapter Modal */}
//       <Modal 
//         title={chapterEditing ? "Edit Chapter" : "Add Chapter"} 
//         open={chapterModalOpen} 
//         onCancel={() => setChapterModalOpen(false)} 
//         onOk={submitChapter}
//       >
//         <Form form={chapterForm} layout="vertical">
//           <Form.Item name="title" label="Title" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="description" label="Description">
//             <Input.TextArea />
//           </Form.Item>
//           <Form.Item name="order" label="Order">
//             <InputNumber min={0} style={{ width: "100%" }} />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Topic Modal */}
//       <Modal 
//         title="Add Topic" 
//         open={topicModalOpen} 
//         onCancel={() => setTopicModalOpen(false)} 
//         onOk={submitTopic}
//       >
//         <Form form={topicForm} layout="vertical">
//           <Form.Item name="topic_name" label="Topic Name" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="order" label="Order">
//             <InputNumber min={0} style={{ width: "100%" }} />
//           </Form.Item>
//           <Form.Item name="type" label="Type" initialValue="paid" rules={[{ required: true }]}>
//             <Select options={[
//               { label: "Paid", value: "paid" }, 
//               { label: "Free", value: "free" }
//             ]} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// }





















// src/app/[locale]/admin/course/[courseId]/chapters/page.tsx

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Typography, Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tooltip,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "./page.module.css";

const { Title } = Typography;

export default function CourseChaptersPage() {
  const params: any = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);

  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);

  // chapter modal
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterEditing, setChapterEditing] = useState<any | null>(null);
  const [chapterForm] = Form.useForm();

  // topic modal (used for both add & edit)
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicEditing, setTopicEditing] = useState<any | null>(null);
  const [currentChapterForTopic, setCurrentChapterForTopic] = useState<any | null>(null);
  const [topicForm] = Form.useForm();

  const load = useCallback(async () => {
    if (!courseId || Number.isNaN(courseId)) {
      message.error("Invalid course id");
      return;
    }
    setLoading(true);
    try {
      // Fetch chapters for this specific course and all courses to get course details
      console.log(`Loading chapters for course ${courseId}`);
      const [chapRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/course_chapters?course_id=${courseId}`, { cache: "no-store" }),
        fetch(`/api/admin/courses`, { cache: "no-store" }),
      ]);

      const chapJson = await chapRes.json().catch(() => ({}));
      const coursesJson = await coursesRes.json().catch(() => ({}));

      if (!chapRes.ok || chapJson?.success !== true) {
        throw new Error(chapJson?.error || "Failed to load chapters");
      }

      // Find the specific course details from the courses list
      const coursesList = Array.isArray(coursesJson?.data) ? coursesJson.data : [];
      const foundCourse = coursesList.find((c: any) => c.id === courseId) ?? null;
      setCourse(foundCourse);

      // Set chapters data - should already include expanded topics from API
      const chaptersData = Array.isArray(chapJson.data) ? chapJson.data : [];
      setChapters(chaptersData);

      console.log("Loaded chapters:", chaptersData);
      console.log("Found course:", foundCourse);

      if (chapJson.debug) {
        console.log("Debug info:", chapJson.debug);
      }

    } catch (e: any) {
      console.error("Error loading chapters:", e);
      message.error(e?.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // open add chapter
  const openAddChapter = () => {
    setChapterEditing(null);
    chapterForm.resetFields();
    chapterForm.setFieldsValue({ order: 0, title: "" });
    setChapterModalOpen(true);
  };

  const openEditChapter = (rec: any) => {
    setChapterEditing(rec);
    chapterForm.setFieldsValue({
      title: rec.title,
      description: rec.description,
      order: rec.order,
      isactive: rec.isactive,
    });
    setChapterModalOpen(true);
  };

  const submitChapter = async () => {
    try {
      const vals = await chapterForm.validateFields();
      const payload: any = {
        title: vals.title,
        description: vals.description ?? null,
        order: vals.order ?? 0,
        course_id: courseId, // store as single course id; backend will put it into array
      };

      if (chapterEditing) {
        payload.id = chapterEditing.id;
        const res = await fetch("/api/admin/course_chapters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || "Update failed");
        message.success("Chapter updated");
      } else {
        const res = await fetch("/api/admin/course_chapters", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || "Create failed");
        message.success("Chapter added");
      }
      setChapterModalOpen(false);
      load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed");
    }
  };

  const deleteChapter = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/course_chapters?id=${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success !== true) throw new Error(j?.error || "Delete failed");
      message.success("Chapter deleted");
      load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete");
    }
  };

  // Topics: open modal to add topic under chapter
  const openAddTopic = (chapter: any) => {
    setCurrentChapterForTopic(chapter);
    setTopicEditing(null);
    topicForm.resetFields();
    topicForm.setFieldsValue({ topic_name: "", order: 0, type: "paid" });
    setTopicModalOpen(true);
  };

  // Open edit topic inline (opens same topic modal prefilled)
  const openEditTopic = (topic: any, chapter: any) => {
    setCurrentChapterForTopic(chapter);
    setTopicEditing(topic);
    topicForm.resetFields();
    topicForm.setFieldsValue({ topic_name: topic.topic_name, order: topic.order, type: topic.type || 'paid' });
    setTopicModalOpen(true);
  };

  const submitTopic = async () => {
    try {
      const vals = await topicForm.validateFields();

      if (topicEditing) {
        // update existing topic
        const payload: any = {
          id: topicEditing.id,
          topic_name: vals.topic_name,
          order: vals.order ?? 0,
          type: vals.type ?? 'paid',
        };

        const res = await fetch('/api/admin/course_topics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success !== true) throw new Error(j?.error || 'Topic update failed');

        message.success('Topic updated');
        setTopicModalOpen(false);
        setTopicEditing(null);
        // no need to update chapter ids — topics themselves changed; reload to fetch updated topic rows
        load();
        return;
      }

      // 1) create topic
      const payloadTopic: any = {
        topic_name: vals.topic_name,
        order: vals.order ?? 0,
        type: vals.type ?? 'paid',
      };

      const resTopic = await fetch('/api/admin/course_topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadTopic),
      });
      const jTopic = await resTopic.json().catch(() => ({}));
      if (!resTopic.ok || jTopic?.success !== true) {
        throw new Error(jTopic?.error || 'Topic create failed');
      }

      const topicId = jTopic.data?.id;

      // 2) append topicId to chapter's course_topic_id array: fetch existing array, push and update
      const chap = currentChapterForTopic;
      const newTopicIds = Array.isArray(chap.course_topic_id) ? [...chap.course_topic_id, topicId] : [topicId];

      const resUpdate = await fetch('/api/admin/course_chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chap.id, course_topic_id: newTopicIds }),
      });
      const jUp = await resUpdate.json().catch(() => ({}));
      if (!resUpdate.ok || jUp?.success !== true) {
        throw new Error(jUp?.error || 'Failed to attach topic to chapter');
      }

      message.success('Topic added');
      setTopicModalOpen(false);
      load();
    } catch (e: any) {
      message.error(e?.message ?? 'Failed to add/update topic');
    }
  };

  const deleteTopic = async (topicId: number, chapter: any) => {
    try {
      // delete topic row
      const res = await fetch(`/api/admin/course_topics?id=${topicId}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success !== true) throw new Error(j?.error || 'Failed to delete topic');

      // remove reference from chapter
      const newIds = (chapter.course_topic_id || []).filter((x: number) => x !== topicId);
      const r2 = await fetch('/api/admin/course_chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chapter.id, course_topic_id: newIds }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok || j2?.success !== true) {
        throw new Error(j2?.error || 'Failed to update chapter after deleting topic');
      }

      message.success('Topic deleted');
      load();
    } catch (e: any) {
      message.error(e?.message ?? 'Failed to delete topic');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <div className={styles.titleCell}>{text}</div>,
    },
    { title: 'Order', dataIndex: 'order', key: 'order', width: 100, className: styles.centerCell },
    {
      title: 'Topics',
      key: 'topics',
      render: (_v: any, rec: any) => (
        <div className={styles.topicsWrapper}>
          {rec.topics?.length ? (
            rec.topics.map((t: any) => (
              <div key={t.id} className={styles.topicRow}>
                <div className={styles.topicName}>
                  <Tooltip
                    placement="top"
                    overlayClassName={styles.nameTooltip}
                    title={<div className={styles.tooltipCard}><strong>{t.topic_name}</strong></div>}
                  >
                    <span>{t.topic_name}</span>
                  </Tooltip>
                </div>

                <div className={styles.topicType}><span className={styles.typeTag}>{t.type}</span></div>

                <div className={styles.topicOrder}>Order: {t.order}</div>

                <div className={styles.topicAction}>
                  {/* <Tooltip placement="top" title={<div className={styles.tooltipCard}>Edit topic</div>}>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openEditTopic(t, rec)} />
                  </Tooltip> */}
                  <Tooltip title="Edit chapter">
                    <Button type="text" icon={<EditOutlined />} onClick={() => openEditTopic(t, rec)} />
                  </Tooltip>

                  {/* <Tooltip placement="top" title={<div className={styles.tooltipCard}>Delete topic</div>}>
                    <Popconfirm title="Delete topic?" onConfirm={() => deleteTopic(t.id, rec)} okText="Delete" okButtonProps={{ danger: true }}>
                      <Button type="text" icon={<DeleteOutlined />} danger style={{ color: '#ff4d4f' }} aria-label="Delete topic" />
                    </Popconfirm>
                  </Tooltip> */}
                  <Tooltip title="Delete topic">
                    <Popconfirm title="Delete topic?" onConfirm={() => deleteTopic(t.id, rec)} okText="Delete" okButtonProps={{ danger: true }}>
                      <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  </Tooltip>
                </div>
              </div>
            ))
          ) : (
            <span style={{ color: '#999' }}>No topics</span>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_v: any, rec: any) => (
        <Space>
          <Tooltip title="Edit chapter">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditChapter(rec)} />
          </Tooltip>
          <Tooltip title="Delete chapter">
            <Popconfirm title="Delete chapter?" onConfirm={() => deleteChapter(rec.id)} okText="Delete" okButtonProps={{ danger: true }}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
          <Button size="small" onClick={() => openAddTopic(rec)} icon={<PlusOutlined />}>Add Topic</Button>
        </Space>
      )
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={4}>Chapters for Course: {course?.coursename || `#${courseId}`}</Title>
        <Space>
          <Button onClick={() => router.back()}>Back</Button>
          <Button type="primary" onClick={openAddChapter}>Add Chapter</Button>
        </Space>
      </div>

      {course && (
        <div className={styles.courseCard}>
          <strong>Course Details:</strong> {course.coursename} &nbsp; | &nbsp; Price: {course.price} &nbsp; | &nbsp; Type: {course.type} &nbsp; | &nbsp; Active: {course.active ? 'Yes' : 'No'}
        </div>
      )}

      <Table
        rowKey="id"
        dataSource={chapters}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        className={styles.table}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: 16 }}>
              <p><strong>Description:</strong> {record.description || 'No description'}</p>
              <p><strong>Active:</strong> {record.isactive ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}</p>
              <p><strong>Updated:</strong> {record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          ),
        }}
      />

      {/* Chapter Modal */}
      {/* <Modal
        title={chapterEditing ? "Edit Chapter" : "Add Chapter"}
        open={chapterModalOpen}
        onCancel={() => setChapterModalOpen(false)}
        onOk={submitChapter}
      >
        <Form form={chapterForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>\
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="order" label="Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal> */}

      {/* Chapter Modal */}
      <Modal
        title={chapterEditing ? "Edit Chapter" : "Add Chapter"}
        open={chapterModalOpen}
        onCancel={() => setChapterModalOpen(false)}
        onOk={submitChapter}
      >
        <Form form={chapterForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="order" label="Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>


      {/* Topic Modal */}
      {/* <Modal
        title={topicEditing ? "Edit Topic" : "Add Topic"}
        open={topicModalOpen}
        onCancel={() => { setTopicModalOpen(false); setTopicEditing(null); }}
        onOk={submitTopic}
      >
        <Form form={topicForm} layout="vertical">
          <Form.Item name="topic_name" label="Topic Name" rules={[{ required: true }]}>\
            <Input />
          </Form.Item>
          <Form.Item name="order" label="Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue="paid" rules={[{ required: true }]}>\
            <Select options={[
              { label: "Paid", value: "paid" },
              { label: "Free", value: "free" }
            ]} />
          </Form.Item>
        </Form>
      </Modal> */}

      {/* Topic Modal */}
      <Modal
        title={topicEditing ? "Edit Topic" : "Add Topic"}
        open={topicModalOpen}
        onCancel={() => { setTopicModalOpen(false); setTopicEditing(null); }}
        onOk={submitTopic}
      >
        <Form form={topicForm} layout="vertical">
          <Form.Item name="topic_name" label="Topic Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="order" label="Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={[
              { label: "Paid", value: "paid" },
              { label: "Free", value: "free" }
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


