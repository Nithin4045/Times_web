"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Row, Col, message } from "antd";
export type ScaleItem = {
  value: number;
  label: string;
};

export type StoredQuestion = {
  id: number;
  section: string;
  question: string;
  scaleMin: number;
  scaleMax: number;
  selected: string;
  scale: ScaleItem[];
};
type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (question: StoredQuestion) => void;
  mode: "add" | "edit";
  nextId?: number;
  initialData?: StoredQuestion;
};

export default function EvlQuestionForm({
  open,
  onClose,
  onSubmit,
  mode,
  nextId,
  initialData,
}: Props) {
  const [form] = Form.useForm();
  const scaleMax = Form.useWatch("scaleMax", form);
  const [isFirstOpen, setIsFirstOpen] = useState(true);

  useEffect(() => {
    if (open) {
      setIsFirstOpen(true);
      if (mode === "edit" && initialData) {
        form.setFieldsValue({
          section: initialData.section,
          question: initialData.question,
          scaleMax: initialData.scaleMax,
          ...Object.fromEntries(
            initialData.scale.map((s) => [`label_${s.value}`, s.label])
          ),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialData, mode, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const scale: ScaleItem[] = [];

      for (let i = 1; i <= values.scaleMax; i++) {
        scale.push({ value: i, label: values[`label_${i}`] });
      }

      const question: StoredQuestion = {
        id: mode === "edit" ? initialData!.id : nextId!,
        section: values.section,
        question: values.question,
        scaleMin: 1,
        scaleMax: values.scaleMax,
        selected: "",
        scale,
      };

      onSubmit(question);
      form.resetFields();
      message.success(
        mode === "edit" ? "Question updated!" : "Question added!"
      );
      onClose();
    } catch {
      message.warning("Please complete all fields");
    }
  };

  return (
    <Modal
      title={
        <div className="MainTitle">
          {mode === "edit" ? "Edit Question" : "Add New Question"}
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      width={1200}
      okButtonProps={{
        className: "contentaddbutton1", // Add your custom class here
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Section" name="section" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Question"
          name="question"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Scale Min">
              <InputNumber value={1} disabled style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Scale Max"
              name="scaleMax"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {scaleMax > 0 && (
          <>
            <div style={{ fontWeight: 600 }}>Scale Labels:</div>
            <Row gutter={16}>
              {Array.from({ length: scaleMax }).map((_, i) => (
                <Col span={8} key={i + 1}>
                  <Form.Item
                    label={`Label ${i + 1}`}
                    name={`label_${i + 1}`}
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
}
