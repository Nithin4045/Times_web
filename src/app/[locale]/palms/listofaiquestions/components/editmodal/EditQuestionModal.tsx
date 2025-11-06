"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Radio, Button, Space } from "antd";

export type EditQuestionModalValue = {
  questionId: string;
  transformationId?: string;         // optional: when editing a transform
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

type Props = {
  open: boolean;
  loading?: boolean;                 // show loading on Save
  initial?: Partial<EditQuestionModalValue>;
  onCancel: () => void;
  onSave: (value: EditQuestionModalValue) => void;
};

const REQUIRED_MSG = "This field is required";

export default function EditQuestionModal({
  open,
  loading,
  initial,
  onCancel,
  onSave,
}: Props) {
  const [form] = Form.useForm<EditQuestionModalValue>();

  // Seed initial values on open
  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      questionId: initial?.questionId ?? "",
      transformationId: initial?.transformationId,
      question: (initial?.question ?? "").trim(),
      options: [
        initial?.options?.[0] ?? "",
        initial?.options?.[1] ?? "",
        initial?.options?.[2] ?? "",
        initial?.options?.[3] ?? "",
      ] as any,
      correctIndex:
        (typeof initial?.correctIndex === "number"
          ? initial?.correctIndex
          : 0) as 0 | 1 | 2 | 3,
    } as any);
  }, [open, initial, form]);

  const onOk = async () => {
    try {
      const values = await form.validateFields();
      const opts: string[] = (values.options || []).slice(0, 4).map((s) => s.trim());

      // Defensive: ensure no empty strings after trim
      if (!values.question?.trim()) {
        form.setFields([{ name: ["question"], errors: [REQUIRED_MSG] }]);
        return;
      }
      const emptyAt = opts.findIndex((o) => !o);
      if (emptyAt >= 0) {
        form.setFields([{ name: ["options", emptyAt], errors: [REQUIRED_MSG] } as any]);
        return;
      }
      // Ensure correctIndex is in range 0..3
      let ci = Number(values.correctIndex);
      if (!(ci >= 0 && ci <= 3)) ci = 0;

      onSave({
        questionId: values.questionId,
        transformationId: values.transformationId,
        question: values.question.trim(),
        options: [opts[0], opts[1], opts[2], opts[3]] as [string, string, string, string],
        correctIndex: ci as 0 | 1 | 2 | 3,
      });
    } catch {
      // antd already highlights invalid fields
    }
  };

  // Custom validator to prevent empty/whitespace-only inputs
  const nonEmpty = (_: any, value: string) =>
    value && value.trim().length > 0 ? Promise.resolve() : Promise.reject(REQUIRED_MSG);

  return (
    <Modal
      open={open}
      title="Edit Question"
      onCancel={onCancel}
      onOk={onOk}
      okText="Save"
      confirmLoading={loading}
      maskClosable={false}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* Hidden IDs */}
        <Form.Item name="questionId" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="transformationId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Question"
          name="question"
          rules={[{ validator: nonEmpty }]}
          required
        >
          <Input.TextArea
            rows={3}
            placeholder="Enter question"
            maxLength={2000}
            showCount
          />
        </Form.Item>

        {/* Exactly 4 options */}
        <Form.List name="options">
          {(fields) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.slice(0, 4).map((field, idx) => (
                <Form.Item
                  key={field.key}
                  label={`Option ${String.fromCharCode(65 + idx)}`}
                  name={[field.name]}
                  rules={[{ validator: nonEmpty }]}
                  required
                >
                  <Input placeholder={`Option ${String.fromCharCode(65 + idx)}`} maxLength={1000} />
                </Form.Item>
              ))}
            </Space>
          )}
        </Form.List>

        {/* Correct answer (radio over the same 4 options) */}
        <Form.Item
          label="Correct Answer"
          name="correctIndex"
          rules={[{ required: true, message: REQUIRED_MSG }]}
          required
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value={0}>Option A</Radio>
              <Radio value={1}>Option B</Radio>
              <Radio value={2}>Option C</Radio>
              <Radio value={3}>Option D</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {/* Optional: inline actions if you want to hide footer buttons
            (keeping Modal footer buttons by default) */}
        {/* <Form.Item>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={onOk}>Save</Button>
          </Space>
        </Form.Item> */}
      </Form>
    </Modal>
  );
}
