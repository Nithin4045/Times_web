// "use client"
// import dayjs from 'dayjs';
// import styles from "@/app/[locale]/class/admin/users/users.module.css"
// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   Space,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   Switch,
//   message, Upload,
//   Flex,
//   DatePicker,
// } from "antd";
// import type { UploadProps } from 'antd';
// import { DeleteOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
// import axios from "axios";
// // import { User } from "@/utils/types";
// // import "@/assets/styles/dashboard.css";

// import Title from "antd/es/typography/Title";
// const { Option } = Select;

// const Users: React.FC = () => {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any | null>(null);
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [imported, setImported] = useState(false);

//   const [form] = Form.useForm();

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get("/api/class/mainUsers");
//         setUsers(response.data);
//         setLoading(false);
//       } catch (error: unknown) {
//         if (axios.isAxiosError(error)) {
//           if (error.response) {
//             console.error(
//               "Failed to fetch users:",
//               error.response.data.message
//             );
//           } else if (error.request) {
//             console.error("No response received:", error.request);
//           } else {
//             console.error("Error", error.message);
//           }
//         } else {
//           console.error("Unexpected error", error);
//         }
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [imported]);

//   console.log(users,">>>>>>>>>>>>>????????????")

//   const columns = [
//     { title: "User Name", dataIndex: "USER_NAME", key: "USER_NAME" },
//     { title: "Name", dataIndex: "FIRST_NAME", key: "FIRST_NAME" },
//     { title: "Batch Name", dataIndex: "BATCH_NAME", key: "BATCH_NAME" },
//     { title: "Role", dataIndex: "ROLE", key: "ROLE" },
//     // { title: "Mobile", dataIndex: "MOBILE", key: "MOBILE" },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: string, record: any) => (
//         <Space size="middle">
//          <Switch key={`tog${record.USER_ID}`}
//             checked={record.STATUS === 1}
//             onChange={() => {toggleUserStatus(record.USER_ID),console.log(record.USER_ID,">>>>>>>>>record.USER_ID")}}
//           />
//           <Button key={`edit${record.USER_ID}`}
//             type="link"
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record)}
//           >
//             Edit
//           </Button>
//           <Button
//         key={`delete${record.USER_ID}`}
//         type="link"
//         icon={<DeleteOutlined />}
//         danger
//         onClick={() => handleDelete(record.USER_ID)}
//       >
//            Delete
//           </Button>
//         </Space>
//       ),
//     },
//   ];

//   const props: UploadProps  = {
//     action: '/api/import?subfolder=USERS&table=USERS',
//     onChange({ file, fileList }) {
//       if (file.status !== 'uploading') {
//         setImported(true);
//         message.success('Users imported successfully.')
//       }
//     },
//   };

//   const handleEdit = (user: any) => {
//     setSelectedUser(user);
//     setEditMode(true);
//     setModalVisible(true);
//     form.setFieldsValue(user);  // Initialize form with selected user data
//   };

//   const toggleUserStatus = async (id: number) => {
//     const userToUpdate = users.find((user) => user.USER_ID === id);
//     console.log(userToUpdate,">>>>>>>>>hndmnc nd cm")
//     if (userToUpdate) {
//       const updatedUsers = users.map((user) =>
//         user.USER_ID === id ? { ...user, STATUS: user.STATUS === 1 ? 0 : 1 } : user
//       );
//       setUsers(updatedUsers);
//       userToUpdate.STATUS = userToUpdate?.STATUS === 1 ? 0 : 1;

//       const payload = {
//         ...userToUpdate,
//         UserStatus : userToUpdate.STATUS
//       }
//       try {
//         const response = await axios.post(`/api/class/mainUsers?action=status`, payload, {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         });
//         console.log('User status updated successfully:', response.data);
//       } catch (error: unknown) {
//         if (axios.isAxiosError(error)) {
//           if (error.response) {
//             console.error('User status update failed:', error.response.data.message);
//             message.error(`User status update failed: ${error.response.data.message}`);
//           } else if (error.request) {
//             console.error('No response received:', error.request);
//             message.error('No response received from the server.');
//           } else {
//             console.error('Error', error.message);
//             message.error(`Error: ${error.message}`);
//           }
//         } else {
//           console.error('Unexpected error', error);
//           message.error('An unexpected error occurred.');
//         }
//         setUsers((prevUsers) =>
//           prevUsers.map((user) =>
//             user.USER_ID === id ? { ...user, STATUS: user.STATUS === 1 ? 0 : 1 } : user
//           )
//         );
//       }
//     }
//   };

//   const handleModalOk = async () => {
//     form
//       .validateFields()
//       .then(async (values) => {
//         if (editMode) {
//           values.USER_ID = selectedUser!.USER_ID;
//           const updatedUsers = users.map((user) =>
//             user.USER_ID === selectedUser!.USER_ID
//               ? { ...user, ...values }
//               : user
//           );

//           setUsers(updatedUsers);
//           const response = await axios.put("/api/class/mainUsers", values, {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           });
//           console.log("User updation successful:", response.data);
//         } else {
//           try {
//             if (!editMode)
//               values.STATUS = 1;
//             const response = await axios.post("/api/class/mainUsers?action=insert", values, {
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             });
//             console.log("User creation successful:", response.data);
//             setUsers([...users, values]);
//           } catch (error: unknown) {
//             if (axios.isAxiosError(error)) {
//               if (error.response) {
//                 console.error(
//                   "User creation failed:",
//                   error.response.data.message
//                 );
//                 message.error(
//                   `User creation failed: ${error.response.data.message}`
//                 );
//               } else if (error.request) {
//                 console.error("No response received:", error.request);
//                 message.error("No response received from the server.");
//               } else {
//                 console.error("Error", error.message);
//                 message.error(`Error: ${error.message}`);
//               }
//             } else {
//               console.error("Unexpected error", error);
//               message.error("An unexpected error occurred.");
//             }
//           }
//         }
//         form.resetFields();
//         setModalVisible(false);
//         setSelectedUser(null);
//         setEditMode(false);

//       })
//       .catch((error) => {
//         console.error("Validation failed:", error);
//       });
//   };

//   const handleModalCancel = () => {
//     form.resetFields();
//     setModalVisible(false);
//     setSelectedUser(null);
//     setEditMode(false);
//   };


//   const handleDelete = async (userId: number) => {
//     try {
//         const response = await axios.delete(`/api/class/mainUsers?id=${userId}`);
//         if (response.status === 200) {
//             setUsers((prevUsers) => prevUsers.filter((user) => user.USER_ID !== userId));
//             message.success("User deleted successfully.");
//         }
//     } catch (error) {
//         if (axios.isAxiosError(error)) {
//             message.error(error.response?.data?.message || "Failed to delete user.");
//         } else {
//             message.error("An unexpected error occurred.");
//         }
//     }
// };


//   return (
//     <div>
//       <Title level={4} className="pl-15 pt-10 mt-5">
//         <span className="user" style={{color:'Black',lineHeight:'3.4'}}> USERS</span>
//       </Title>
//       <Flex justify="flex-end" align="flex-start" gap={6} className="mb-5 mr-5">
//         <Button type="primary" onClick={() => setModalVisible(true)}>
//           Add User
//         </Button>
//         {/* <ExcelDownload data={users} filename="users"  columns={columns}/> */}
//         {/* <PdfDownload data={users} filename="users" columns={columns} showView={false} /> */}
//         <Upload {...props}>
//           <Button icon={<UploadOutlined />}>Upload</Button>
//         </Upload>
//       </Flex>
//       <Table id="users-table"
//       className={styles.adminuserstable}
//         columns={columns}
//         dataSource={users}
//         rowKey="id"
//         loading={loading}
//       />

// <Modal
//   title={editMode ? "Edit User" : "Add User"}
//   open={modalVisible}
//   onOk={handleModalOk}
//   onCancel={handleModalCancel}
//   width={800} // Made modal wider to accommodate more fields
// >
//   <Form
//     form={form}
//     layout="vertical"
//     name="userForm"
//   >
//     {/* Required Fields Section */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Basic Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//         <Form.Item
//           name="USER_NAME"
//           label="User Name"
//           rules={[
//             { required: true, message: "Please enter user name" },
//             { type: "email", message: "Please enter a valid email address" }
//           ]}
//         >
//           <Input />
//         </Form.Item>

//         {/* <Form.Item
//           name="Module"
//           label="Module"
//           rules={[
//             { required: true, message: "Please enter password" },
//           ]}
//         >
//          <Select>
//             <Option value="0">0</Option>
//             <Option value="1">1</Option>
//             <Option value="2">2</Option>
//             <Option value="3">3</Option>
//             <Option value="1,2">1-2</Option>
//             <Option value="1,3">1-3</Option>
//             <Option value="2,3">2-3</Option>

//           </Select>
//         </Form.Item> */}

//         <Form.Item
//           name="ROLE"
//           label="Role"
//           rules={[{ required: true, message: "Please select role" }]}
//         >
//           <Select>
//             <Option value="STU">Student</Option>
//             <Option value="ADM">Admin</Option>
//           </Select>
//         </Form.Item>

//         <Form.Item
//           name="FIRST_NAME"
//           label="First Name"
//           rules={[{ required: true, message: "Please enter first name" }]}
//         >
//           <Input />
//         </Form.Item>
//       </div>
//     </div>

//     {/* Optional Fields - Personal Information */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Personal Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//         <Form.Item name="LAST_NAME" label="Last Name">
//           <Input />
//         </Form.Item>

//         <Form.Item name="GENDER" label="Gender">
//           <Select>
//             <Option value="M">Male</Option>
//             <Option value="F">Female</Option>
//             <Option value="O">Other</Option>
//           </Select>
//         </Form.Item>



//         <Form.Item name="DATE_OF_BIRTH" label="Date of Birth">
//           <Input type="date" />
//         </Form.Item>


//         <Form.Item name="MOBILE" label="Mobile">
//           <Input />
//         </Form.Item>

//         <Form.Item name="MOBILE_NUMBER" label="Alternative Mobile">
//           <Input />
//         </Form.Item>
//       </div>
//     </div>

//     {/* Contact Information */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Contact Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//         <Form.Item name="OFFICIAL_EMAIL" label="Official Email">
//           <Input type="email" />
//         </Form.Item>

//         <Form.Item name="PERSONAL_EMAIL" label="Personal Email">
//           <Input type="email" />
//         </Form.Item>

//         <Form.Item name="ADDRESS" label="Address">
//           <Input.TextArea />
//         </Form.Item>

//         <Form.Item name="CITY" label="City">
//           <Input />
//         </Form.Item>

//         <Form.Item name="STATE" label="State">
//           <Input />
//         </Form.Item>
//       </div>
//     </div>

//     {/* Educational Information */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Educational Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//         <Form.Item name="SCHOOL_NAME" label="School Name">
//           <Input />
//         </Form.Item>

//         <Form.Item name="COLLEGE_NAME" label="College Name">
//           <Input />
//         </Form.Item>

//         <Form.Item name="COLLEGE_CODE" label="College Code">
//           <Input />
//         </Form.Item>

//         <Form.Item name="DEGREE" label="Degree">
//           <Input />
//         </Form.Item>

//         <Form.Item name="DISCIPLINE" label="Discipline">
//           <Input />
//         </Form.Item>

//         <Form.Item name="YEAR" label="Year">
//           <Input />
//         </Form.Item>

//         <Form.Item name="MODULE" label="Module">
//           <Input />
//         </Form.Item>
//       </div>
//     </div>

//     {/* Batch Information */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Batch Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//         <Form.Item name="BATCH_NAME" label="Batch Name">
//           <Input />
//         </Form.Item>

//         <Form.Item name="BATCH_CODE" label="Batch Code">
//           <Input />
//         </Form.Item>

//         <Form.Item name="BATCH_TYPE" label="Batch Type">
//           <Input />
//         </Form.Item>

//         <Form.Item name="SUBSCRIPTION_TYPE" label="Subscription Type">
//           <Input />
//         </Form.Item>
//       </div>
//     </div>

//     {/* Batch Information */}
//     <div style={{ marginBottom: '20px' }}>
//       <h3>Batch Information</h3>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//       <Form.Item name="XP_POINTS" label="XP points">
//           <Input />
//         </Form.Item>

//         <Form.Item name="XP_LEVEL" label="xp level">
//           <Input />
//         </Form.Item>

//         <Form.Item name="COINS" label="COINS">
//           <Input />
//         </Form.Item>

//         <Form.Item name="LAST_STREAK" label="LAST_STREAK">
//           <Input />
//         </Form.Item>
//         <Form.Item name="LONGEST_STREAK" label="LONGEST_STREAK">
//           <Input />
//         </Form.Item>
//         <Form.Item name="CURRENT_STREAK" label="CURRENT_STREAK">
//           <Input />
//         </Form.Item>

//       </div>
//       </div>
//   </Form>
// </Modal>

//     </div>
//   );
// };
// export default Users;

"use client"
import styles from "@/app/[locale]/class/admin/users/users.module.css"
import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message, Upload,
  Flex,
  DatePicker,
  Tooltip,
  Row
} from "antd";
import moment from "moment";
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';
import { DeleteOutlined, EditOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
// import { User } from "@/utils/types";
// import "@/assets/styles/dashboard.css";

import Title from "antd/es/typography/Title";
import { FaPlusCircle } from 'react-icons/fa';
const { Option } = Select;

const Users: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string | null>("");
  const [imported, setImported] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/class/mainUsers");
        setUsers(response.data);
        setLoading(false);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error(
              "Failed to fetch users:",
              error.response.data.message
            );
          } else if (error.request) {
            console.error("No response received:", error.request);
          } else {
            console.error("Error", error.message);
          }
        } else {
          console.error("Unexpected error", error);
        }
        setLoading(false);
      }
    };

    fetchUsers();
  }, [imported]);

  // console.log(users,">>>>>>>>>>>>>????????????")

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8, backgroundColor: '#8356A9' }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, confirm, dataIndex)}
            size="small"
            style={{ width: 90, backgroundColor: '#8356A9', color: 'white', }}
          >
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#FFF" : "#FFF" }} />
    ),
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        ? record[dataIndex]
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase())
        : "",
    render: (text: string) =>
      searchedColumn === dataIndex ? <span>{text}</span> : text,
  });

  const handleSearch = (
    selectedKeys: string[],
    confirm: any,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: any, confirm: any, dataIndex: string) => {
    clearFilters();
    setSearchText("");
    handleSearch([], confirm, dataIndex);
  };

  const handleToggleStatus = async (userId: string, status: number) => {
    try {
      const response = await fetch(`/api/class/mainUsers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ USER_ID: userId, STATUS: status }),
      });

      if (!response.ok) throw new Error("Failed to update course status");
      setImported(prev => !prev);
      messageApi.success(`Course marked as ${status === 1 ? "Active" : "Inactive"}`);

    } catch (err) {
      messageApi.error((err as Error).message);
    }
  };

  const columns = [
    // {
    //   title: "Serial No.",
    //   dataIndex: "serialNo",
    //   key: "serialNo",
    //   render: (_: any, __: any, index: number) =>
    //     index + 1 + (pagination.current - 1) * pagination.pageSize,
    // },
    {
      title: "Actions",
      key: "actions",
      render: (_: string, record: any) => (
        <Space size="small">
          {/* <Switch key={`tog${record.USER_ID}`}
            checked={record.STATUS === 1}
            onChange={() => {toggleUserStatus(record.USER_ID),console.log(record.USER_ID,">>>>>>>>>record.USER_ID")}}
          /> */}
          <Tooltip title="Edit">
            <Button key={`edit${record.USER_ID}`}
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
            </Button>
          </Tooltip>

          {/* <Tooltip title="Delete">
          <Button
            key={`delete${record.USER_ID}`}
            type="link"
            icon={<DeleteOutlined />}
            danger
           onClick={() => handleDelete(record.USER_ID)}
            >
          </Button>
          </Tooltip> */}

          <Tooltip>
            <Switch
              checked={record.STATUS === 1}
              checkedChildren="A"
              unCheckedChildren="I"
              onChange={(checked) =>
                handleToggleStatus(record.USER_ID, checked ? 1 : 0)
              }
            />
          </Tooltip>

        </Space>
      ),
    },
    {
      title: "User Name",
      dataIndex: "USER_NAME",
      key: "USER_NAME",
      ...getColumnSearchProps("USER_NAME"),
      sorter: (a: any, b: any) => a.USER_NAME?.localeCompare(b.USER_NAME),
    },
    {
      title: "First Name",
      dataIndex: "FIRST_NAME",
      key: "FIRST_NAME",
      ...getColumnSearchProps("FIRST_NAME"),
      sorter: (a: any, b: any) => a.FIRST_NAME?.localeCompare(b.FIRST_NAME),
    },
    {
      title: "Last Name",
      dataIndex: "LAST_NAME",
      key: "LAST_NAME",
      ...getColumnSearchProps("LAST_NAME"),
      sorter: (a: any, b: any) => a.LAST_NAME?.localeCompare(b.LAST_NAME),
    },
    // { title: "Mobile Number", dataIndex: "MOBILE_NUMBER", key: "MOBILE_NUMBER" },
    {
      title: "Date of Birth",
      dataIndex: "DATE_OF_BIRTH",
      key: "DATE_OF_BIRTH",
      ...getColumnSearchProps("DATE_OF_BIRTH"),
      sorter: (a: any, b: any) => a.DATE_OF_BIRTH - b.DATE_OF_BIRTH,
      render: (text: any) => text ? moment(text).format("YYYY-MM-DD") : "NULL"
    },
    {
      title: "Batch Name",
      dataIndex: "BATCH_NAME",
      key: "BATCH_NAME",
      ...getColumnSearchProps("BATCH_NAME"),
      sorter: (a: any, b: any) => a.BATCH_NAME?.localeCompare(b.BATCH_NAME),
    },
    {
      title: "Gender",
      dataIndex: "GENDER",
      key: "GENDER",
      ...getColumnSearchProps("GENDER"),
      sorter: (a: any, b: any) => a.GENDER?.localeCompare(b.GENDER),
    },
    {
      title: "Role",
      dataIndex: "ROLE",
      key: "ROLE",
      ...getColumnSearchProps("ROLE"),
      sorter: (a: any, b: any) => a.ROLE?.localeCompare(b.ROLE),
    },
    // { title: "Mobile", dataIndex: "MOBILE", key: "MOBILE" },

  ];

  const props: UploadProps = {
    action: '/api/common/import?subfolder=USERS&table=USERS',
    onChange({ file, fileList }) {
      if (file.status !== 'uploading') {
        setImported(true);
        messageApi.success('Users imported successfully.')
      }
    },
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditMode(true);
    form.setFieldsValue({
      ...user,
      DATE_OF_BIRTH: user.DATE_OF_BIRTH ? dayjs(user.DATE_OF_BIRTH) : null, // Convert to dayjs
    });
    setModalVisible(true);
  };

  const toggleUserStatus = async (id: number) => {
    const userToUpdate = users.find((user) => user.USER_ID === id);
    // console.log(userToUpdate,">>>>>>>>>hndmnc nd cm")
    if (userToUpdate) {
      const updatedUsers = users.map((user) =>
        user.USER_ID === id ? { ...user, STATUS: user.STATUS === 1 ? 0 : 1 } : user
      );
      setUsers(updatedUsers);
      userToUpdate.STATUS = userToUpdate?.STATUS === 1 ? 0 : 1;

      const payload = {
        ...userToUpdate,
        UserStatus: userToUpdate.STATUS
      }
      try {
        const response = await axios.post(`/api/class/mainUsers?action=status`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('User status updated successfully:', response.data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error('User status update failed:', error.response.data.message);
            messageApi.error(`User status update failed: ${error.response.data.message}`);
          } else if (error.request) {
            console.error('No response received:', error.request);
            messageApi.error('No response received from the server.');
          } else {
            console.error('Error', error.message);
            messageApi.error(`Error: ${error.message}`);
          }
        } else {
          console.error('Unexpected error', error);
          messageApi.error('An unexpected error occurred.');
        }
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.USER_ID === id ? { ...user, STATUS: user.STATUS === 1 ? 0 : 1 } : user
          )
        );
      }
    }
  };

  const handleModalOk = async () => {
    form
      .validateFields()
      .then(async (values) => {
        if (editMode) {
          values.USER_ID = selectedUser!.USER_ID;

          if (values.DATE_OF_BIRTH) {
            values.DATE_OF_BIRTH = values.DATE_OF_BIRTH.toISOString();
          }
          const updatedUsers = users.map((user) =>
            user.USER_ID === selectedUser!.USER_ID
              ? { ...user, ...values }
              : user
          );

          setUsers(updatedUsers);
          const response = await axios.put("/api/class/mainUsers", values, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("User updation successful:", response.data);
        } else {
          try {
            if (!editMode)
              values.STATUS = 1;

            if (values.DATE_OF_BIRTH) {
              values.DATE_OF_BIRTH = values.DATE_OF_BIRTH.toISOString();
            }
            const response = await axios.post("/api/class/mainUsers", values, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log("User creation successful:", response.data);
            setUsers([...users, values]);
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
              if (error.response) {
                console.error(
                  "User creation failed:",
                  error.response.data.message
                );
                messageApi.error(
                  `User creation failed: ${error.response.data.message}`
                );
              } else if (error.request) {
                console.error("No response received:", error.request);
                messageApi.error("No response received from the server.");
              } else {
                console.error("Error", error.message);
                messageApi.error(`Error: ${error.message}`);
              }
            } else {
              console.error("Unexpected error", error);
              messageApi.error("An unexpected error occurred.");
            }
          }
        }
        form.resetFields();
        setModalVisible(false);
        setSelectedUser(null);
        setEditMode(false);

      })
      .catch((error) => {
        console.error("Validation failed:", error);
      });
  };

  const handleModalCancel = () => {
    form.resetFields();
    setModalVisible(false);
    setSelectedUser(null);
    setEditMode(false);
  };


  const handleDelete = async (userId: number) => {
    try {
      const response = await axios.delete(`/api/class/mainUsers?id=${userId}`);
      if (response.status === 200) {
        setUsers((prevUsers) => prevUsers.filter((user) => user.USER_ID !== userId));
        messageApi.success("User deleted successfully.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        messageApi.error(error.response?.data?.message || "Failed to delete user.");
      } else {
        messageApi.error("An unexpected error occurred.");
      }
    }
  };


  return (
    <>
    
      <div style={{ padding: '20px' }}>
        <div className='Contentactions-Header' >
          <div >
            <h2 className={styles.titlestyle}> MANAGE USERS </h2>
          </div>
          {contextHolder}
          <div className={styles.contentright}>
            <Upload {...props}>
              <Button icon={<UploadOutlined />} className={styles.contentaddbutton}>
                Upload Users
              </Button>
            </Upload>

            {/* <Input
        placeholder="Search by short code, title, or description"
        value={searchTerm}
        className={styles.searchbutton1}
        onChange={handleSearch}
        prefix={<SearchOutlined />}
        style={{ width: 300, color: 'white' }}
      /> */}

            <Button
              type="primary"
              className="contentaddbutton1"
              icon={<FaPlusCircle />}
              style={{ backgroundColor: '#8356a9' }}
              onClick={() => {
                setModalVisible(true)
              }}
            >
              Add User
            </Button>
          </div>
        </div>

        <Row className={styles.admincontentdiv}>
          <Table
            className={styles.adminuserstable}
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: pagination.pageSize }}
            scroll={{ x: 1400 }}
            onChange={handleTableChange}
          />
        </Row>

        <Modal
          title={editMode ? "Edit User" : "Add User"}
          open={modalVisible}
          maskClosable={false}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={800} // Made modal wider to accommodate more fields
        >
          <Form
            form={form}
            layout="vertical"
            name="userForm"
          >
            {/* Required Fields Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="USER_NAME"
                  label="User Name"
                  rules={[
                    { required: true, message: "Please enter user name" },
                    { type: "email", message: "Please enter a valid email address" }
                  ]}
                >
                  <Input />
                </Form.Item>

                {/* <Form.Item
          name="Module"
          label="Module"
          rules={[
            { required: true, message: "Please enter password" },
          ]}
        >
         <Select>
            <Option value="0">0</Option>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
            <Option value="1,2">1-2</Option>
            <Option value="1,3">1-3</Option>
            <Option value="2,3">2-3</Option>
           
          </Select>
        </Form.Item> */}

                <Form.Item
                  name="ROLE"
                  label="Role"
                  rules={[{ required: true, message: "Please select role" }]}
                >
                  <Select>
                    <Option value="STU">Student</Option>
                    <Option value="ADM">Admin</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="FIRST_NAME"
                  label="First Name"
                  rules={[{ required: true, message: "Please enter first name" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="STATUS"
                  label="Status"
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select>
                    <Option value={1}>Active</Option>
                    <Option value={0}>Inactive</Option>
                  </Select>
                </Form.Item>

              </div>
            </div>

            {/* Optional Fields - Personal Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="LAST_NAME" label="Last Name">
                  <Input />
                </Form.Item>

                <Form.Item name="GENDER" label="Gender">
                  <Select>
                    <Option value="M">Male</Option>
                    <Option value="F">Female</Option>
                    <Option value="O">Other</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="DATE_OF_BIRTH" label="Date of Birth">
                  {/* <Input type="date" /> */}
                  <DatePicker />
                </Form.Item>

                <Form.Item name="MOBILE" label="Mobile">
                  <Input />
                </Form.Item>

                {/* <Form.Item name="MOBILE_NUMBER" label="Alternative Mobile">
                  <Input />
                </Form.Item> */}
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="OFFICIAL_EMAIL" label="Official Email">
                  <Input type="email" />
                </Form.Item>

                <Form.Item name="PERSONAL_EMAIL" label="Personal Email">
                  <Input type="email" />
                </Form.Item>

                <Form.Item name="ADDRESS" label="Address">
                  <Input.TextArea />
                </Form.Item>

                <Form.Item name="CITY" label="City">
                  <Input />
                </Form.Item>

                <Form.Item name="STATE" label="State">
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* Educational Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Educational Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="SCHOOL_NAME" label="School Name">
                  <Input />
                </Form.Item>

                <Form.Item name="COLLEGE_NAME" label="College Name">
                  <Input />
                </Form.Item>

                <Form.Item name="COLLEGE_CODE" label="College Code">
                  <Input />
                </Form.Item>

                <Form.Item name="DEGREE" label="Degree">
                  <Input />
                </Form.Item>

                <Form.Item name="DISCIPLINE" label="Discipline">
                  <Input />
                </Form.Item>

                <Form.Item name="YEAR" label="Year">
                  <Input />
                </Form.Item>

                <Form.Item name="MODULE" label="Module"
                  rules={[{ required: true, message: "Please enter Module" }]}
                >
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* Batch Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3>Batch Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="BATCH_NAME" label="Batch Name">
                  <Input />
                </Form.Item>

                <Form.Item name="BATCH_CODE" label="Batch Code">
                  <Input />
                </Form.Item>

                <Form.Item name="BATCH_TYPE" label="Batch Type">
                  <Input />
                </Form.Item>

                <Form.Item name="SUBSCRIPTION_TYPE" label="Subscription Type">
                  <Input />
                </Form.Item>
              </div>
            </div>


            {/* <div style={{ marginBottom: '20px' }}>
      <h3>Student Performnace Level</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <Form.Item name="XP_POINTS" label="XP points">
          <Input />
        </Form.Item>

        <Form.Item name="XP_LEVEL" label="xp level">
          <Input />
        </Form.Item>

        <Form.Item name="COINS" label="COINS">
          <Input disabled />
        </Form.Item>

        <Form.Item name="LAST_STREAK" label="LAST_STREAK">
          <Input />
        </Form.Item>
        <Form.Item name="LONGEST_STREAK" label="LONGEST_STREAK">
          <Input />
        </Form.Item>
        <Form.Item name="CURRENT_STREAK" label="CURRENT_STREAK">
          <Input />
        </Form.Item>

      </div>
      </div> */}
          </Form>
        </Modal>

      </div>

    </>
  );
};
export default Users;
