// 'use client'

// import React, { useEffect, useState } from 'react'
// // import './EvlAddQuestion.css'
// import {
//   Modal,
//   Form,
//   Input,
//   InputNumber,
//   Row,
//   Col,
//   Switch,
//   Select,
//   Button,
//   Table,
//   message
// } from 'antd'

// /* ---------- type ---------- */
// export type KVPair = { key: string; value: string }

// export type TemplateField = {
//   unique_id: number
//   template_id: string
//   value: string
//   field_id: string
//   field_name: string
//   field_description: string
//   component: string
//   field_length: number
//   placeholder: string
//   help_text: string
//   colspan: number
//   rowspan: number
//   display_order: number
//   field_group: string
//   required: number
//   dataset?: string
//   data?: KVPair[]
// }

// type Props = {
//   open: boolean
//   onClose: () => void
//   onSubmit: (f: TemplateField) => void
//   mode: 'add' | 'edit'
//   nextId?: number
//   templateId?: string
//   initialData?: TemplateField
// }

// const PREDEFINED = [
//   'gender',
//   'language',
//   'bloodgroups',
//   'maritalstatus',
//   'interboards',
//   'states',
//   'graduation',
//   'siblingtype',
//   'occupation'
// ]

// export default function EvlAddQuestion ({
//   open,
//   onClose,
//   onSubmit,
//   mode,
//   nextId,
//   templateId,
//   initialData
// }: Props) {
//   const [form] = Form.useForm()

//   const [confOpen, setConfOpen] = useState(false)
//   const [rowOpen, setRowOpen] = useState(false)
//   const [rowForm] = Form.useForm()

//   // Track if component is custom input or select dropdown
//   const [isOther, setIsOther] = useState(false)

//   // Controlled component value to handle switch between input and select
//   const [componentVal, setComponentVal] = useState('')

//   const [kvRows, setKvRows] = useState<{ id: string; key: string; value: string }[]>([])
//   const [savedKv, setSavedKv] = useState<KVPair[]>([])

//   useEffect(() => {
//     if (!open) return

//     if (mode === 'edit' && initialData) {
//       form.setFieldsValue({ ...initialData, required: initialData.required === 1 })
//       const comp = initialData.component
//       setComponentVal(comp)
//       setIsOther(comp === 'text' || comp === 'rowsource')
//       setSavedKv(initialData.data ?? [])
//     } else {
//       form.resetFields()
//       form.setFieldsValue({ template_id: templateId ?? '', required: false })
//       setIsOther(false)
//       setComponentVal('')
//       setSavedKv([])
//     }
//   }, [open])

//   const handleMainOk = async () => {
//     try {
//       const v = await form.validateFields()
//       const uid = mode === 'edit' ? initialData!.unique_id : nextId!
//       const field_name = v.field_description.toLowerCase().replace(/\s+/g, '')

//       const rec: TemplateField = {
//         ...v,
//         unique_id: uid,
//         field_name,
//         value: '',
//         required: v.required ? 1 : 0,
//         dataset: `#${v.component}`,
//         data: savedKv.length && !isOther ? savedKv : undefined
//       }

//       console.log('Final Output →', rec)
//       onSubmit(rec)

//       form.resetFields()
//       form.setFieldsValue({ template_id: templateId ?? '', required: false })
//       setIsOther(false)
//       setComponentVal('')
//       setSavedKv([])
//       message.success(mode === 'edit' ? 'Field updated!' : 'Field added!')
//     } catch {
//       message.warning('Complete all required data')
//     }
//   }

//   const onComponentChange = (val: string) => {
//   setComponentVal(val)

//   if (val === 'text' || val === 'rowsource') {
//     setIsOther(true)
//     setConfOpen(false)
//     setKvRows([])
//     setSavedKv([])
//     form.setFieldsValue({ component: val })
//   } else {
//     setIsOther(false)
//     setKvRows([])
//     setSavedKv([])
//     setConfOpen(true)
//     form.setFieldsValue({ component: val })
//   }
// }

//   const onCustomComponentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value
//     setComponentVal(val)
//     form.setFieldsValue({ component: val })

//     if (val !== 'text' && val !== 'rowsource' && val.trim() === '') {
//         setIsOther(false)
//         setConfOpen(false)
//         setKvRows([])
//         setSavedKv([])
//         form.setFieldsValue({ component: '' })
//         setComponentVal('')
//     }

//   }

//   /* ---------- add row ---------- */
//   const addKvRow = () => setRowOpen(true)
//   const saveKvRow = async () => {
//     try {
//       const { key, value } = await rowForm.validateFields()
//       setKvRows(r => [...r, { id: Date.now().toString(), key, value }])
//       rowForm.resetFields()
//       setRowOpen(false)
//     } catch { }
//   }

//   return (
//     <>
//       <Modal
//         title={mode === 'edit' ? 'Edit Field' : 'Add New Field'}
//         open={open}
//         onOk={handleMainOk}
//         onCancel={onClose}
//         width={700}
//         destroyOnHidden
//       >
//         <Form form={form} layout="vertical" initialValues={{ required: false }}>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item label="Template ID" name="template_id" rules={[{ required: true }]}>
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item label="Field ID" name="field_id" rules={[{ required: true }]}>
//                 <Input />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item label="Field Group" name="field_group" rules={[{ required: true }]}>
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               {isOther ? (
//                 <Form.Item label="Component (custom)" name="component" rules={[{ required: true }]}>
//                   <Input
//                     value={componentVal}
//                     onChange={onCustomComponentInputChange}
//                     placeholder="Type custom component"
//                     allowClear
//                   />
//                 </Form.Item>
//               ) : (
//                 <Form.Item label="Component" name="component" rules={[{ required: true }]}>
//                   <Select
//                     placeholder="Select component"
//                     onSelect={onComponentChange}
//                     value={componentVal || undefined}
//                     showSearch
//                     allowClear
//                     onClear={() => {
//                       setComponentVal('')
//                       form.setFieldsValue({ component: '' })
//                     }}
//                   >
//                     {PREDEFINED.map(p => (
//                       <Select.Option key={p} value={p}>
//                         {p}
//                       </Select.Option>
//                     ))}
//                     <Select.Option value="rowsource">rowsource</Select.Option>
//                     <Select.Option value="text">text</Select.Option>
//                   </Select>
//                 </Form.Item>
//               )}
//             </Col>
//           </Row>

//           <Form.Item label="Field Description" name="field_description" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>

//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item label="Field Length" name="field_length" rules={[{ required: true }]}>
//                 <InputNumber min={0} style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item label="Colspan" name="colspan" rules={[{ required: true }]}>
//                 <InputNumber min={1} style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item label="Rowspan" name="rowspan" rules={[{ required: true }]}>
//                 <InputNumber min={1} style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item label="Placeholder" name="placeholder" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item label="Help Text" name="help_text" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>

//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item label="Display Order" name="display_order" rules={[{ required: true }]}>
//                 <InputNumber min={1} style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item label="Required" name="required" valuePropName="checked">
//                 <Switch />
//               </Form.Item>
//             </Col>
//           </Row>
//         </Form>
//       </Modal>

//       <Modal
//         title={`Configure ${form.getFieldValue('component')}`}
//         open={confOpen}
//         onOk={() => {
//           const clean = kvRows
//             .filter(r => r.key.trim() && r.value.trim())
//             .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
//           setSavedKv(clean)
//           setConfOpen(false)
//         }}
//         onCancel={() => setConfOpen(false)}
//         width={600}
//         destroyOnHidden
//       >
//         <Button type="primary" onClick={addKvRow} style={{ marginBottom: 12 }}>
//           Add Row
//         </Button>

//         <Table
//           size="small"
//           bordered
//           pagination={false}
//           rowKey="id"
//           dataSource={kvRows}
//           columns={[
//             {
//               title: 'Key',
//               dataIndex: 'key',
//               render: (_: any, rec) => (
//                 <Input
//                   value={rec.key}
//                   onChange={e =>
//                     setKvRows(rows =>
//                       rows.map(r => (r.id === rec.id ? { ...r, key: e.target.value } : r))
//                     )
//                   }
//                 />
//               )
//             },
//             {
//               title: 'Value',
//               dataIndex: 'value',
//               render: (_: any, rec) => (
//                 <Input
//                   value={rec.value}
//                   onChange={e =>
//                     setKvRows(rows =>
//                       rows.map(r => (r.id === rec.id ? { ...r, value: e.target.value } : r))
//                     )
//                   }
//                 />
//               )
//             },
//             {
//               title: 'Action',
//               key: 'action',
//               render: (_: any, rec) => (
//                 <Button
//                   danger
//                   size="small"
//                   onClick={() => setKvRows(rows => rows.filter(r => r.id !== rec.id))}
//                 >
//                   Delete
//                 </Button>
//               )
//             }
//           ]}
//         />
//       </Modal>

//       <Modal
//         title="Add Row"
//         open={rowOpen}
//         onOk={saveKvRow}
//         onCancel={() => setRowOpen(false)}
//         destroyOnHidden
//       >
//         <Form form={rowForm} layout="vertical">
//           <Form.Item label="Key" name="key" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item label="Value" name="value" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </>
//   )
// }

"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Switch,
  Select,
  Button,
  Table,
  message,
} from "antd";
import "@/app/global.css";
/* ---------- type ---------- */
export type KVPair = { key: string; value: string };

export type TemplateField = {
  unique_id: number;
  template_id: string;
  value: string;
  field_id: string;
  field_name: string;
  field_description: string;
  component: string;
  field_length: number;
  placeholder: string;
  help_text: string;
  colspan: number;
  rowspan: number;
  display_order: number;
  field_group: string;
  required: number;
  dataset?: string;
  data?: KVPair[];
  rowsource:string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (f: TemplateField, dataset: any) => void;
  mode: "add" | "edit";
  nextId?: number;
  templateId?: string;
  initialData?: TemplateField;
  masterFromData: any;
};

const PREDEFINED = ["dropdown", "date"];

export default function EvlAddQuestion({
  open,
  onClose,
  onSubmit,
  mode,
  nextId,
  templateId,
  initialData,
  masterFromData,
}: Props) {
  const [form] = Form.useForm();
  const [confOpen, setConfOpen] = useState(false);
  const [rowOpen, setRowOpen] = useState(false);
  const [rowForm] = Form.useForm();
  const [isOther, setIsOther] = useState(false);
  const [componentVal, setComponentVal] = useState("");
  const [kvRows, setKvRows] = useState<
    { id: string; key: string; value: string }[]
  >([]);
  const [savedKv, setSavedKv] = useState<KVPair[]>([]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      console.log(
        initialData,
        "initialData..........",
        masterFromData,
        masterFromData?.[0]?.data
      );
      form.setFieldsValue({
        ...initialData,
        required: initialData.required === 1,
      });
      const comp = initialData.component;
      setComponentVal(comp);
      setIsOther(comp === "text" || comp === "rowsource");
      setKvRows(masterFromData?.[0]?.data ?? []);
      setSavedKv(masterFromData?.[0]?.data ?? []);
    } else {
      form.resetFields();
      form.setFieldsValue({ template_id: templateId ?? "", required: false });
      setIsOther(false);
      setComponentVal("");
      setSavedKv([]);
    }
  }, [open]);

  const handleMainOk = async () => {
    try {
      const v = await form.validateFields();
      const uid = mode === "edit" ? initialData!.unique_id : nextId!;
      const field_name = v.field_description.toLowerCase().replace(/\s+/g, "");

      const rec: TemplateField = {
        ...v,
        unique_id: uid,
        field_name,
        value: "",
        required: v.required ? 1 : 0,
      };

      const dataset: any = {
        dataset: `#${v.field_name}`,
        data: savedKv.length && !isOther ? savedKv : undefined,
      };

      console.log("Final Output →", rec);
      onSubmit(rec, dataset);

      form.resetFields();
      form.setFieldsValue({ template_id: templateId ?? "", required: false });
      setIsOther(false);
      setComponentVal("");
      setSavedKv([]);
      message.success(mode === "edit" ? "Field updated!" : "Field added!");
    } catch {
      message.warning("Complete all required data");
    }
  };

  const onComponentChange = (val: string) => {
    setComponentVal(val);

    if (val === "text" || val === "date" || val === "rowsource") {
      setIsOther(true);
      setConfOpen(false);
      // setKvRows([])s;
      // setSavedKv([]);
      form.setFieldsValue({ component: val });
    } else {
      setIsOther(false);
      // setKvRows([]);
      // setSavedKv([]);
      setConfOpen(true);
      form.setFieldsValue({ component: val });
    }
  };

  const onCustomComponentInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    setComponentVal(val);
    form.setFieldsValue({ component: val });

    if (val !== "text" && val !== "rowsource" && val.trim() === "") {
      setIsOther(false);
      setConfOpen(false);
      setKvRows([]);
      setSavedKv([]);
      form.setFieldsValue({ component: "" });
      setComponentVal("");
    }
  };

  const addKvRow = () => setRowOpen(true);

  const saveKvRow = async () => {
    try {
      const { key, value } = await rowForm.validateFields();
      setKvRows((r) => [...r, { id: Date.now().toString(), key, value }]);
      rowForm.resetFields();
      setRowOpen(false);
    } catch {}
  };

  return (
    <>
      <Modal
        title={
          <div className="MainTitle">
            {mode === "edit" ? "Edit Field" : "Add New Field"}
          </div>
        }
        open={open}
        onOk={handleMainOk}
        onCancel={onClose}
        width={1200}
        destroyOnHidden
        okButtonProps={{
          className: "contentaddbutton1", // Add your custom class here
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ required: false }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Template ID"
                name="template_id"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Field ID"
                name="field_id"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Field Group"
                name="field_group"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Field Name"
                name="field_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Field Description"
                name="field_description"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isOther ? (
                <Form.Item
                  label="Component (custom)"
                  name="component"
                  rules={[{ required: true }]}
                >
                  <Input
                    value={componentVal}
                    onChange={onCustomComponentInputChange}
                    placeholder="Type custom component"
                    allowClear
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  label="Component"
                  name="component"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select component"
                    onSelect={onComponentChange}
                    value={componentVal || undefined}
                    showSearch
                    allowClear
                    onClear={() => {
                      setComponentVal("");
                      form.setFieldsValue({ component: "" });
                    }}
                  >
                    {PREDEFINED.map((p) => (
                      <Select.Option key={p} value={p}>
                        {p}
                      </Select.Option>
                    ))}
                    <Select.Option value="text">text</Select.Option>
                  </Select>
                </Form.Item>
              )}
            </Col>

            
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Field Length"
                name="field_length"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Colspan"
                name="colspan"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Rowspan"
                name="rowspan"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Placeholder"
            name="placeholder"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Help Text"
            name="help_text"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Display Order"
                name="display_order"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Required"
                name="required"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={confOpen}
        onOk={() => {
          const clean = kvRows
            .filter((r) => r.key.trim() && r.value.trim())
            .map(({ key, value }) => ({
              key: key.trim(),
              value: value.trim(),
            }));

          console.log("Saved Key-Value Pairs:", clean);
          setSavedKv(clean);
          setConfOpen(false);
        }}
        onCancel={() => setConfOpen(false)}
        width={600}
        destroyOnHidden
        okButtonProps={{
          className: "contentaddbutton1", // Add your class here
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "25px",
          }}
        >
          <div className="MainTitle">{`Configure ${form.getFieldValue(
            "component"
          )}`}</div>

          <Button
            type="primary"
            className="contentaddbutton1"
            onClick={addKvRow}
            style={{ marginBottom: 12 }}
          >
            Add Row
          </Button>
        </div>

        <Table
          className="CC_Table"
          size="small"
          bordered
          pagination={false}
          rowKey="id"
          dataSource={kvRows}
          columns={[
            {
              title: "Key",
              dataIndex: "key",
              render: (_: any, rec) => (
                <Input
                  value={rec.key}
                  onChange={(e) =>
                    setKvRows((rows) =>
                      rows.map((r) =>
                        r.id === rec.id ? { ...r, key: e.target.value } : r
                      )
                    )
                  }
                />
              ),
            },
            {
              title: "Value",
              dataIndex: "value",
              render: (_: any, rec) => (
                <Input
                  value={rec.value}
                  onChange={(e) =>
                    setKvRows((rows) =>
                      rows.map((r) =>
                        r.id === rec.id ? { ...r, value: e.target.value } : r
                      )
                    )
                  }
                />
              ),
            },
            {
              title: "Action",
              key: "action",
              render: (_: any, rec) => (
                <Button
                  danger
                  size="small"
                  onClick={() =>
                    setKvRows((rows) => rows.filter((r) => r.id !== rec.id))
                  }
                >
                  Delete
                </Button>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="Add Key-Value Pair"
        open={rowOpen}
        onOk={saveKvRow}
        onCancel={() => setRowOpen(false)}
        destroyOnHidden
      >
        <Form form={rowForm} layout="vertical">
          <Form.Item label="Key" name="key" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Value" name="value" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
