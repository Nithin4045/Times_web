"use client";

import { Modal, Form, InputNumber, Select, Row, Col, message } from "antd";
import { FormInstance } from "antd/es/form";
import { useEffect, useState } from "react";
import axios from "axios";
import Spin from "antd/lib/spin";
import dayjs from "dayjs";

const { Option } = Select;

interface AddTestRepositoryDetailsProps {
  open: boolean;
  form: FormInstance;
  onCancel: () => void;
  isEdit: boolean;
  repository_details_id?: any;
  test_id: number;
  onSuccess: () => void;
  onOk?: () => void;
}

export default function AddTestRepositoryDetails({
  open,
  form,
  onCancel,
  isEdit,
  repository_details_id,
  test_id,
  onSuccess,
}: AddTestRepositoryDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [topicOptions, setTopicOptions] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // 🔹 Pre-fill form when editing a subject/section
  useEffect(() => {
    if (open && isEdit && repository_details_id) {
      setEditLoading(true);
      axios
        .get(
          `/api/evaluate/Admin/ManageTestRepositoryDetails/EditTestRepository?repository_details_id=${repository_details_id}`
        )
        .then((res) => {
          const data: any = res.data[0];
          if (!data) return;


          const mappedValues = {
            subjectid: data?.subject_id ?? form.getFieldValue("subjectid"),
            topicid: Number(data?.TOPIC_ID ?? form.getFieldValue("topicid") ?? null),
            questioncount: data?.question_count ?? form.getFieldValue("questioncount"),
            duration_min: data?.duration_min ?? form.getFieldValue("duration_min"),
            rendering_order: data?.rendering_order ?? form.getFieldValue("rendering_order"),
            selection_method: (data?.selection_method ?? form.getFieldValue("selection_method") ?? "").toUpperCase(),
            subject_marks: data?.subject_marks ?? form.getFieldValue("subject_marks"),
            negative_marks: data?.negative_marks ?? form.getFieldValue("negative_marks"),
            REQUIRE_RESOURCE: data?.require_resource ?? data?.REQUIRE_RESOURCE ?? form.getFieldValue("REQUIRE_RESOURCE"),
          };
          form.setFieldsValue(mappedValues);

        })
        .catch(() => {
          message.error("Failed to load subject data");
          form.resetFields();
        })
        .finally(() => {
          setEditLoading(false);
        });
    } else {
      form.resetFields();
      setEditLoading(false);
    }
  }, [open, isEdit, repository_details_id, form]);

  // 🔹 Fetch dropdown options when modal opens
  useEffect(() => {
    if (!open) return;

    // Subjects
    axios
      .get(
        "/api/evaluate/Admin/ManageTestRepositoryDetails/Dropdownvlaues?type=subjects"
      )
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.subjects ?? [];
        const normalized = (raw as any[]).map((s) => ({
          subject_id: s.SUBJECT_ID ?? s.subject_id,
          subject_description:
            s.SUBJECT_DESCRIPTION ?? s.subject_description ?? "",
          subject_code: s.SUBJECT_CODE ?? s.subject_code ?? "",
        }));
        setSubjectOptions(normalized);
      })
      .catch(() => message.error("Failed to load subjects"));

    // Topics
    axios
      .get(
        "/api/evaluate/Admin/ManageTestRepositoryDetails/Dropdownvlaues?type=topics"
      )
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.topics ?? [];
        setTopicOptions(raw);
      })
      .catch(() => message.error("Failed to load topics"));
  }, [open]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEdit && repository_details_id) {
        const payload = { ...values, repository_details_id, test_id };
        await axios.post(
          `/api/evaluate/Admin/ManageTestRepositoryDetails`,
          payload
        );
        message.success("Subject updated successfully");
      } else {
        const payload = { ...values, test_id };
        await axios.post(
          "/api/evaluate/Admin/ManageTestRepositoryDetails",
          payload
        );
        message.success("Subject added successfully");
      }

      onSuccess();
      form.resetFields();
      onCancel();
    } catch {
      message.error("Please fill all required fields");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Section" : "Add Section"}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleOk}
      okText={isEdit ? "Update" : "Add"}
      confirmLoading={loading}
      closable={true}
      maskClosable={false}
      okButtonProps={{
        className: "contentaddbutton1",
      }}
    >
      <Spin spinning={editLoading}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Subject"
                name="subjectid"
                rules={[{ required: true, message: "Please select a subject" }]}
              >
                <Select placeholder="Select Subject">
                  {subjectOptions.map((subject: any) => (
                    <Option key={subject.subject_id} value={subject.subject_id}>
                      {`${subject.subject_description} - ${subject.subject_code}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Topic"
                name="topicid"
                rules={[{ required: true, message: "Please select a topic" }]}
              >
                <Select placeholder="Select Topic">
                  {topicOptions.map((topic: any) => (
                    <Option key={topic.TOPIC_ID} value={topic.TOPIC_ID}>
                      {`${topic.TOPIC_DESCRIPTION} - ${topic.TOPIC_CODE}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Question Count"
                name="questioncount"
                rules={[
                  { required: true, message: "Please enter question count" },
                ]}
              >
                <InputNumber
                  placeholder="Enter Question Count"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Duration (min)"
                name="duration_min"
                rules={[{ required: true, message: "Please enter duration" }]}
              >
                <InputNumber
                  placeholder="Enter Duration(min)"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Section Order"
                name="rendering_order"
                rules={[
                  { required: true, message: "Please select section Order" },
                ]}
              >
                <Select placeholder="Select Order">
                  {[...Array(12)].map((_, i) => {
                    const val = (i + 1) * 10;
                    return (
                      <Option key={val} value={val}>
                        {i + 1}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Selection Method"
                name="selection_method"
                rules={[{ required: true, message: "Please select a method" }]}
              >
                <Select placeholder="Select method">
                  <Option value="RANDOM">Random</Option>
                  <Option value="SEQUENTIAL">Sequential</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Subject Marks"
                name="subject_marks"
                rules={[
                  { required: true, message: "Please enter Subject Marks" },
                ]}
              >
                <InputNumber
                  placeholder="Enter Subject Marks"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Apply Negative Marks"
                name="negative_marks"
                rules={[
                  { required: true, message: "Please select negative marks" },
                ]}
              >
                <Select placeholder="Apply Negative Marks?">
                  <Option value="1">Yes</Option>
                  <Option value="0">No</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Require Resource"
                name="REQUIRE_RESOURCE"
                rules={[
                  {
                    required: true,
                    message: "Please select require resource",
                  },
                ]}
              >
                <Select placeholder="Please select require resource">
                  <Option value="1">Yes</Option>
                  <Option value="0">No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
