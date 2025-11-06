// "use client";

// import React, { useState, useMemo } from "react";
// import { Table, Button, Tabs, Empty, Modal } from "antd";
// import EvlAddQuestion, { TemplateField } from "./EvlGeneralAddQuestion";
// // import './EvlAddQuestion.css'
// import EvlGeneralAddQuestion from "./EvlGeneralAddQuestion";

// export default function Page({
//   isGeneralDataModalVisible,
//   handleGeneralDataSave,
//   setIsGeneralDataModalVisible,
//   general_data,
//   masterFromData,
// }: {
//   isGeneralDataModalVisible: boolean;
//   handleGeneralDataSave: (value: any, masterData: any) => void;
//   setIsGeneralDataModalVisible: (value: boolean) => void;
//   general_data: any;
//   masterFromData: any;
// }) {
//   const [fields, setFields] = useState<TemplateField[]>(general_data);
//   const [nextId, setNextId] = useState(1);
//   const [masterData, setMasterData] = useState<any[]>(masterFromData);
//   const [formOpen, setFormOpen] = useState(false);
//   const [formMode, setFormMode] = useState<"add" | "edit">("add");
//   const [editTarget, setEditTarget] = useState<TemplateField | null>(null);
//   console.log("general_data", general_data, "masterFromData", masterFromData);
//   const openAdd = () => {
//     setFormMode("add");
//     setEditTarget(null);
//     setFormOpen(true);
//   };
//   const openEdit = (rec: TemplateField) => {
//     setFormMode("edit");
//     setEditTarget(rec);
//     setFormOpen(true);
//   };

//   const handleSubmit = (rec: TemplateField, dataset: any) => {
//     console.log(dataset, "Submitted field data:", JSON.stringify(rec, null, 2));
//     if (formMode === "add") {
//       console.log("add");
//       setFields((prev) => [...prev, rec]);
//       setNextId((prev) => prev + 1);
//     } else {
//       console.log("edit");
//       setFields((prev) =>
//         prev.map((f) => (f.unique_id === rec.unique_id ? rec : f))
//       );
//     }
//     setMasterData((prev) => [...prev, dataset]);
//     setFormOpen(false);
//     setEditTarget(null);
//   };
//   const templateIds = useMemo(
//     () => Array.from(new Set((fields ?? []).map((f) => f.template_id))),
//     [fields]
//   );

//   const mainColumns = [
//     { title: "ID", dataIndex: "unique_id", width: 80 },
//     { title: "Field Name", dataIndex: "field_name" },
//     { title: "Description", dataIndex: "field_description" },
//     {
//       title: "Dataset",
//       dataIndex: "component",
//       render: (c: string) => `#${c}`,
//     },
//     { title: "Length", dataIndex: "field_length", width: 90 },
//     { title: "Display Order", dataIndex: "display_order", width: 120 },
//     {
//       title: "Action",
//       width: 80,
//       render: (_: any, rec: TemplateField) => (
//         <Button type="link" onClick={() => openEdit(rec)}>
//           Edit
//         </Button>
//       ),
//     },
//   ];

//   const expandedRowRender = (rec: TemplateField) =>
//     Array.isArray(rec.data) && rec.data.length > 0 ? (
//       <Table
//         size="small"
//         pagination={false}
//         bordered
//         rowKey={(_, i) => String(i)}
//         columns={[
//           { title: "Key", dataIndex: "key" },
//           { title: "Value", dataIndex: "value" },
//         ]}
//         dataSource={rec.data}
//       />
//     ) : null;

//   return (
//     <Modal
//       title="Add General or Master Question"
//       open={isGeneralDataModalVisible}
//       onCancel={() => setIsGeneralDataModalVisible(false)}
//       onOk={() => {
//         handleGeneralDataSave(fields, masterData);
//       }}
//     >
//       <div style={{ padding: 24 }}>
//         <Button type="primary" onClick={openAdd}>
//           Add Field
//         </Button>

//         {templateIds.length === 0 ? (
//           <Empty style={{ marginTop: 40 }} description="No fields yet" />
//         ) : (
//           <Tabs style={{ marginTop: 32 }} type="line">
//             {templateIds.map((tid) => (
//               <Tabs.TabPane tab={`Template: ${tid}`} key={tid}>
//                 <Table
//                   bordered
//                   pagination={false}
//                   rowKey="unique_id"
//                   columns={mainColumns}
//                   dataSource={fields.filter((f) => f.template_id === tid)}
//                   expandable={{ expandedRowRender }}
//                 />
//               </Tabs.TabPane>
//             ))}
//           </Tabs>
//         )}

//         <EvlGeneralAddQuestion
//           open={formOpen}
//           onClose={() => setFormOpen(false)}
//           onSubmit={handleSubmit}
//           mode={formMode}
//           nextId={nextId}
//           templateId=""
//           initialData={editTarget ?? undefined}
//         />
//       </div>
//     </Modal>
//   );
// }

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Tabs, Empty, Modal, Select, Spin, Space, Tooltip, Popconfirm } from "antd";
import EvlGeneralAddQuestion, { TemplateField } from "./EvlGeneralAddQuestion";
import "@/app/global.css";
import debounce from "lodash/debounce";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
interface FormField {
  UNIQUE_ID: number;
  FIELD_DESCRIPTION: string;
}

export default function Page({
  isGeneralDataModalVisible,
  handleGeneralDataSave,
  setIsGeneralDataModalVisible,
  general_data,
  masterFromData,
}: {
  isGeneralDataModalVisible: boolean;
  handleGeneralDataSave: (value: any, masterData: any) => void;
  setIsGeneralDataModalVisible: (value: boolean) => void;
  general_data: TemplateField[];
  masterFromData: any[];
}) {
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [nextId, setNextId] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<TemplateField | null>(null);
  const [generalfields, setgeneralFields] = useState<FormField[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async (search = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/evaluate/Admin/generaldata-dropdowns`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const filtered = data.fields.filter((field: FormField) =>
        field.FIELD_DESCRIPTION.toLowerCase().includes(search.toLowerCase())
      );

      setgeneralFields(filtered);
    } catch (err) {
      setError("Failed to load form fields");
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldsDebounced = useMemo(() => debounce(fetchFields, 500), []);
  useEffect(() => {
    fetchFields();
    return () => {
      fetchFieldsDebounced.cancel();
    };
  }, []);

  useEffect(() => {
    const safeGeneralData = Array.isArray(general_data) ? general_data : [];
    setFields(safeGeneralData);
    setMasterData(Array.isArray(masterFromData) ? masterFromData : []);
    const maxId = Math.max(0, ...safeGeneralData.map((f) => f.unique_id || 0));
    setNextId(maxId + 1);
  }, [general_data, masterFromData]);

  const openAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (rec: TemplateField) => {
    setFormMode("edit");
    setEditTarget(rec);
    setFormOpen(true);
  };

  const handleSubmit = (rec: TemplateField, dataset: any) => {
    if (formMode === "add") {
      setFields((prev) => [...prev, { ...rec, unique_id: nextId }]);
      setNextId((prev) => prev + 1);
      setMasterData((prev) => [...prev, { ...dataset, unique_id: nextId }]);
    } else {
      setFields((prev) =>
        prev.map((f) => (f.unique_id === rec.unique_id ? rec : f))
      );
      setMasterData((prev) => {
        const index = prev.findIndex(
          (item) => item.unique_id === rec.unique_id
        );
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...dataset, unique_id: rec.unique_id };
          return updated;
        }
        return [...prev, { ...dataset, unique_id: rec.unique_id }];
      });
    }

    setFormOpen(false);
    setEditTarget(null);
  };

  const templateIds = useMemo(
    () => Array.from(new Set((fields ?? []).map((f) => f.template_id))),
    [fields]
  );
  // const handleDelete = (rec: TemplateField) => {
  //   setFields((prev) => prev.filter((f) => f.unique_id !== rec.unique_id));
  //   setMasterData((prev) => 
  //   prev.filter((item) => item.unique_id !== rec.unique_id)
  // );
  // };
const handleDelete = (rec: TemplateField) => {
  console.log('juhhkkkk',rec,'rec')
  // Deleting from fields based on unique_id
  setFields((prev) => prev.filter((f) => f.unique_id !== rec.unique_id));

  // Deleting from masterData based on the dataset name
  setMasterData((prev) =>
    prev.filter((item) => item.dataset !== rec.rowsource) // assuming rec.ROWSOURCE holds the dataset name
  );
};
  const mainColumns = [
    {
      title: "Action",
      width: 80,
      render: (_: any, rec: TemplateField) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(rec)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure to delete this field?"
              onConfirm={() => handleDelete(rec)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Unique Id",
      dataIndex: "unique_id",

      render: (val: number | null) =>
        val ?? <i style={{ color: "#999" }}>N/A</i>,
    },
    {
      title: "Field Name",
      dataIndex: "field_name",
      render: (text: string | null) =>
        text || <i style={{ color: "#999" }}>N/A</i>,
    },
    {
      title: "Description",
      dataIndex: "field_description",
      render: (text: string | null) =>
        text || <i style={{ color: "#999" }}>N/A</i>,
    },
    {
      title: "Length",
      dataIndex: "field_length",

      render: (text: number | null) =>
        text != null ? text : <i style={{ color: "#999" }}>N/A</i>,
    },
    {
      title: "Field Group",
      dataIndex: "field_group",

      render: (text: number | null) =>
        text != null ? text : <i style={{ color: "#999" }}>N/A</i>,
    },
    {
      title: "Display Order",
      dataIndex: "display_order",

      render: (text: number | null) =>
        text != null ? text : <i style={{ color: "#999" }}>N/A</i>,
    },


  ];

  const expandedRowRender = (rec: TemplateField) =>
    Array.isArray(rec.data) && rec.data.length > 0 ? (
      <Table
        size="small"
        pagination={false}
        bordered
        rowKey={(_, i) => String(i)}
        columns={[
          {
            title: "Key",
            dataIndex: "key",
            render: (key: string | null) =>
              key || <i style={{ color: "#999" }}>N/A</i>,
          },
          {
            title: "Value",
            dataIndex: "value",
            render: (val: string | null) =>
              val || <i style={{ color: "#999" }}>N/A</i>,
          },
        ]}
        dataSource={rec.data}
      />
    ) : null;


  const normalizeKeysToLowerCase = (obj: { [key: string]: any }): { [key: string]: any } => {
    const normalizedObj: { [key: string]: any } = {}; 
    Object.keys(obj).forEach((key) => {
      const lowerCaseKey = key.toLowerCase();
      // Only assign lowercase key to the object
      if (!normalizedObj.hasOwnProperty(lowerCaseKey)) {
        normalizedObj[lowerCaseKey] = obj[key];
      }
    });
    return normalizedObj;
  };

  // async function handleSubmitids() {
  //   const res = await fetch('/api/evaluate/Admin/generaldata-dropdowns', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ selectedFieldIds: selectedIds }),
  //   });

  //   if (!res.ok) {
  //     alert("Failed to load field details");
  //     return;
  //   }

  //   const { fields: newFields, masterData: newMasterData } = await res.json();
  //   const normalizedFields = newFields.map((f: any) => normalizeKeysToLowerCase(f));


  //   const existingIds = new Set(fields.map((f) => f.unique_id));
  //   const additions = newFields
  //     .filter((f: { UNIQUE_ID: number; }) => !existingIds.has(f.UNIQUE_ID))
  //     .map((f: {
  //       FIELD_ID: any;
  //       FIELD_GROUP: any; ROWSOURCE: any; UNIQUE_ID: any; FIELD_NAME: any; FIELD_DESCRIPTION: any; COMPONENT: any; FIELD_LENGTH: any; COLSPAN: any; ROWSPAN: any; DISPLAY_ORDER: any; REQUIRED: any; PLACEHOLDER: any; HELP_TEXT: any; TEMPLATE_ID: any;
  //     }) => {
  //       const data = newMasterData
  //         .filter((md: { DATASET_ID: any; }) => md.DATASET_ID === f.ROWSOURCE)
  //         .map((md: { KEY_VALUE: any; DISPLAY_VALUE: any; }) => ({
  //           key: md.KEY_VALUE,
  //           value: md.DISPLAY_VALUE,
  //         }));
  //       return {
  //         ...f,
  //         unique_id: f.UNIQUE_ID,
  //         field_name: f.FIELD_NAME,
  //         field_id: f.FIELD_ID,
  //         field_description: f.FIELD_DESCRIPTION,
  //         component: f.COMPONENT,
  //         field_length: f.FIELD_LENGTH,
  //         colspan: f.COLSPAN,
  //         rowspan: f.ROWSPAN,
  //         display_order: f.DISPLAY_ORDER,
  //         required: f.REQUIRED,
  //         placeholder: f.PLACEHOLDER,
  //         field_group: f.FIELD_GROUP,
  //         help_text: f.HELP_TEXT,
  //         template_id: f.TEMPLATE_ID,
  //         value: "",
  //         data: f.ROWSOURCE ? data : undefined,
  //       };
  //     });

  //   setFields((prev) => [...prev, ...additions]);

  //   // Update masterData only with new datasets (avoiding duplicates)
  //   const existingDatasetIds = new Set(masterData.map((m) => m.dataset));
  //   const newDatasets = newMasterData
  //     .reduce((acc: any[], md: any) => {
  //       const ds = acc.find((d) => d.dataset === md.DATASET_ID);
  //       if (ds) {
  //         ds.data.push({ key: md.KEY_VALUE, value: md.DISPLAY_VALUE });
  //       } else {
  //         acc.push({
  //           dataset: md.DATASET_ID,
  //           data: [{ key: md.KEY_VALUE, value: md.DISPLAY_VALUE }],
  //         });
  //       }
  //       return acc;
  //     }, [])
  //     .filter((ds: { dataset: any; }) => !existingDatasetIds.has(ds.dataset));

  //   setMasterData((prev) => [...prev, ...newDatasets]);
  // }





  // async function handleSubmitids() {
  //   const res = await fetch('/api/evaluate/Admin/generaldata-dropdowns', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ selectedFieldIds: selectedIds }),
  //   });

  //   if (!res.ok) {
  //     alert("Failed to load field details");
  //     return;
  //   }

  //   const { fields: newFields, masterData: newMasterData } = await res.json();

  //   // Normalize keys to lowercase for newFields
  //   const normalizedFields = newFields.map((f: any) => normalizeKeysToLowerCase(f));

  //   // Deduplicate by unique_id
  //   const existingIds = new Set(fields.map((f) => f.unique_id));

  //   const additions = normalizedFields
  //     .filter((f: { unique_id: number; }) => !existingIds.has(f.unique_id))  // Check if unique_id is not already in existingIds
  //     .map((f: { rowsource: any; }) => {
  //       const data = newMasterData
  //         .filter((md: { dataset_id: any; }) => md.dataset_id === f.rowsource)  // Assuming 'dataset_id' is correct
  //         .map((md: { key_value: any; display_value: any; }) => ({
  //           key: md.key_value,
  //           value: md.display_value,
  //         }));

  //       return {
  //         ...f,
  //         value: "",  // Default value
  //         data: f.rowsource ? data : undefined,  // Only include data if ROWSOURCE is present
  //       };
  //     });

  //   setFields((prev) => [...prev, ...additions]);

  //   // Update masterData only with new datasets (avoiding duplicates)
  //   const existingDatasetIds = new Set(masterData.map((m) => m.dataset));
  //   const newDatasets = newMasterData
  //     .reduce((acc: { dataset: any; data: { key: any; value: any; }[]; }[], md: { dataset_id: any; key_value: any; display_value: any; }) => {
  //       const ds = acc.find((d: { dataset: any; }) => d.dataset === md.dataset_id); // Assuming 'dataset_id' is correct
  //       if (ds) {
  //         ds.data.push({ key: md.key_value, value: md.display_value });
  //       } else {
  //         acc.push({
  //           dataset: md.dataset_id,
  //           data: [{ key: md.key_value, value: md.display_value }],
  //         });
  //       }
  //       return acc;
  //     }, [])
  //     .filter((ds: { dataset: any; }) => !existingDatasetIds.has(ds.dataset));

  //   setMasterData((prev) => [...prev, ...newDatasets]);
  // }
async function handleSubmitids() {
  const res = await fetch('/api/evaluate/Admin/generaldata-dropdowns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedFieldIds: selectedIds }),
  });

  if (!res.ok) {
    alert("Failed to load field details");
    return;
  }

  const { fields: newFields, masterData: newMasterData } = await res.json();
  
  // Deduplicate fields based on unique_id
  const existingIds = new Set(fields.map((f) => f.unique_id));
  const additions = newFields
    .filter((f: { UNIQUE_ID: number; }) => !existingIds.has(f.UNIQUE_ID))
    .map((f: {
      FIELD_ID: any;
      FIELD_GROUP: any;
      ROWSOURCE: any;
      UNIQUE_ID: any;
      FIELD_NAME: any;
      FIELD_DESCRIPTION: any;
      COMPONENT: any;
      FIELD_LENGTH: any;
      COLSPAN: any;
      ROWSPAN: any;
      DISPLAY_ORDER: any;
      REQUIRED: any;
      PLACEHOLDER: any;
      HELP_TEXT: any;
      TEMPLATE_ID: any;
    }) => {
      const data = newMasterData
        .filter((md: { DATASET_ID: any; }) => md.DATASET_ID === f.ROWSOURCE)
        .map((md: { KEY_VALUE: any; DISPLAY_VALUE: any; }) => ({
          key: md.KEY_VALUE,
          value: md.DISPLAY_VALUE,
        }));
      return {
        ...f,
        unique_id: f.UNIQUE_ID,
        field_name: f.FIELD_NAME,
        field_id: f.FIELD_ID,
        field_description: f.FIELD_DESCRIPTION,
        component: f.COMPONENT,
        field_length: f.FIELD_LENGTH,
        colspan: f.COLSPAN,
        rowspan: f.ROWSPAN,
        display_order: f.DISPLAY_ORDER,
        required: f.REQUIRED,
        placeholder: f.PLACEHOLDER,
        field_group: f.FIELD_GROUP,
        help_text: f.HELP_TEXT,
        template_id: f.TEMPLATE_ID,
        value: "",
        data: f.ROWSOURCE ? data : undefined,
      };
    });
    const normalizedFields = additions.map((f: any) => normalizeKeysToLowerCase(f));


  setFields((prev) => [...prev, ...normalizedFields]);

  // Handle MasterData - Avoid adding duplicate dataset or key
  const existingDatasetIds = new Set(masterData.map((m) => m.dataset));

  const newDatasets = newMasterData
    .reduce((acc: any[], md: any) => {
      const ds = acc.find((d) => d.dataset === md.DATASET_ID);
      if (ds) {
        // Check if the key already exists in the dataset data array
        const existingKey = ds.data.some((dataItem: any) => dataItem.key === md.KEY_VALUE);
        if (!existingKey) {
          ds.data.push({ key: md.KEY_VALUE, value: md.DISPLAY_VALUE });
        }
      } else {
        acc.push({
          dataset: md.DATASET_ID,
          data: [{ key: md.KEY_VALUE, value: md.DISPLAY_VALUE }],
        });
      }
      return acc;
    }, [])
    .filter((ds: { dataset: any; }) => !existingDatasetIds.has(ds.dataset));  // Avoid adding datasets that already exist

  setMasterData((prev) => [...prev, ...newDatasets]);
}



  return (
    <Modal
      open={isGeneralDataModalVisible}
      onCancel={() => setIsGeneralDataModalVisible(false)}  
      onOk={() => {
        handleGeneralDataSave(fields, masterData);
      }}
      okButtonProps={{
        className: "contentaddbutton1", // Add your custom class here
      }}
      width={"95vw"}
    >
      <div style={{ paddingTop: 24, paddingLeft: 24, paddingBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="MainTitle">Add General or Master Question</div>
          <Button
            type="primary"
            className="contentaddbutton1"
            onClick={openAdd}
          >
            Add Field
          </Button>
        </div >

        <div style={{ marginTop: "10px" }}>
          <label>Select Fields : </label>
          <Select
            mode="multiple"
            labelInValue
            value={selectedIds.map((id) => {
              const field = generalfields.find((f) => f.UNIQUE_ID === id);
              return { key: String(id), label: field?.FIELD_DESCRIPTION || String(id) };
            })}
            placeholder="Search and select fields"
            notFoundContent={loading ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={fetchFieldsDebounced}
            onChange={(values) => {
              const ids = values.map((v) => Number(v.key));
              setSelectedIds(ids);
            }}
            style={{ width: "50%" }}
          >
            {generalfields.map((field) => (
              <Select.Option key={field.UNIQUE_ID} value={String(field.UNIQUE_ID)}>
                {field.FIELD_DESCRIPTION}
              </Select.Option>
            ))}
          </Select>
          <button onClick={handleSubmitids} style={{ padding: "6px 15px", borderRadius: '6px', marginLeft:'10px' }} className="contentaddbutton1">
            OK
          </button>
        </div>


        {templateIds.length === 0 ? (
          <Empty style={{ marginTop: 40 }} description="No fields yet" />
        ) : (
          <Tabs style={{ marginTop: 32 }} type="line">
            {templateIds.map((tid) => (
              <Tabs.TabPane tab={`${tid}`} key={tid}>
                <Table
                  className="CC_Table"
                  bordered
                  pagination={false}
                  rowKey="unique_id"
                  columns={mainColumns}
                  dataSource={fields.filter((f) => f.template_id === tid)}
                // expandable={{ expandedRowRender }}
                />
              </Tabs.TabPane>
            ))}
          </Tabs>
        )}

        <EvlGeneralAddQuestion
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          mode={formMode}
          nextId={nextId}
          templateId=""
          initialData={editTarget ?? undefined}
          masterFromData={masterFromData}
        />
      </div>
    </Modal>
  );
}
