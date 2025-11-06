"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Radio, Rate, Button, Card } from "antd";
import { useSession } from "next-auth/react";
import { commonStore } from "@/store/common/common";
// import { useStore } from "@/store"; // Assume zustand store is set up

interface FeedbackField {
  unique_id: number;
  [key: string]: any; // Make it dynamic to support any field
}

interface FeedbackFormProps {
  testId: number | string;
  onSubmitSuccess: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({  testId, onSubmitSuccess }) => {
  const [form] = Form.useForm();
  const { data: session } = useSession();
  const collegeCode = 'session?.user?.';
  const batchCode = 'session?.user?';
  const userId = 'session?.user?.id';
  const module = 'session?.user?.module';
  const containerRef = useRef<HTMLDivElement>(null);
  // const templateId = useStore((state) => state.templateId); // Fetch templateId from zustand
  const [feedbackData, setFeedbackData] = useState<FeedbackField[]>([]);
  const [showIssueTextbox, setShowIssueTextbox] = useState<{ [key: number]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [templateId, setTemplateId] = useState();
  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
          const response = await fetch(`/api/common/feedbackForm?college_code=${collegeCode}`);
          const data = await response.json();
  
          // Extract `template_id` and store it in Zustand
          const { TEMPLATE_ID, form_data } = data;
          console.log(data,">>>>>>>>>>>>>data")
  
          // Parse form data if it's a string
          const parsedData = typeof form_data === "string" ? JSON.parse(form_data) : form_data;
  
          // Store `template_id` in Zustand
          setTemplateId(TEMPLATE_ID);
  
          // Store feedback data in state
          setFeedbackData(Array.isArray(parsedData) ? parsedData : []);
      } catch (error) {
          console.error("Error fetching feedback data:", error);
      }
  };

    if (collegeCode) {
      fetchFeedbackData();
    }
  }, [collegeCode]);

  const handleRadioChange = (uniqueId: number, value: string, field: any) => {
    if (field.conditional_textbox) {
      setShowIssueTextbox((prev) => ({ ...prev, [uniqueId]: value === field.conditional_textbox.show_if }));
    }
  };

  const handleSubmit = async (values: any) => {
    const formData = feedbackData.map((field) => {
      const fieldData: any = { unique_id: field.unique_id };
  
      Object.keys(field).forEach((key) => {
        if (key !== "unique_id") {
          const fieldKey = `${key}_${field.unique_id}`;
          fieldData[key] = values[fieldKey] || (field[key]?.component === "rating" ? 0 : ""); // Default values
        }
      });
  
      return fieldData;
    });
  
    const payload = {
      test_id: testId,
      USER_FORM_DATA: JSON.stringify(formData),
      MODULE_TYPE: module,
      USER_ID: userId,
      BATCH_CODE: batchCode,
      COLLEGE_CODE: collegeCode,
      TEMPLATE_ID: templateId,
    };
  
    try {
      await fetch("/api/common/feedbackForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      form.resetFields();
      setIsModalOpen(false);
      onSubmitSuccess()
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };
  

  return (
    <>
      <Modal
        title="We appreciate your feedback"
        open={isModalOpen}
        // maskClosable={false}
        // onClose={() => setIsModalOpen(false)}
        closable={false}
        footer={null}
        // destroyOnHidden
        getContainer={containerRef.current || false}
      >
        <Card>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {feedbackData.map((field) => (
              <div key={field.unique_id}>
                {Object.entries(field).map(([key, config]) => {
                  if (key === "unique_id") return null;

                  switch (config.component) {
                    case "text":
                      return (
                        <Form.Item
                          key={key}
                          label={key.replace(/_/g, " ").toUpperCase()}
                          name={`${key}_${field.unique_id}`}
                          rules={config.mandatory ? [{ required: true, message: `Please enter ${key}` }] : []}
                        >
                          <Input placeholder={config.placeholder} />
                        </Form.Item>
                      );

                    case "radio":
                      return (
                        <Form.Item
                          key={key}
                          label={key.replace(/_/g, " ").toUpperCase()}
                          name={`${key}_${field.unique_id}`}
                          rules={config.mandatory ? [{ required: true, message: `Please select an option` }] : []}
                        >
                          <Radio.Group
                            options={config.options}
                            onChange={(e) => handleRadioChange(field.unique_id, e.target.value, config)}
                          />
                        </Form.Item>
                      );

                    case "rating":
                      return (
                        <Form.Item
                          key={key}
                          label={key.replace(/_/g, " ").toUpperCase()}
                          name={`${key}_${field.unique_id}`}
                          initialValue={null}
                          rules={config.mandatory ? [{ required: true, message: "Please provide a rating" }] : []}
                        >
                          <Rate count={config.scale} />
                        </Form.Item>
                      );

                    default:
                      return null;
                  }
                })}

                {/* Conditional Textbox */}
                {field.Did_you_Face_any_Technical_Issue?.conditional_textbox && showIssueTextbox[field.unique_id] && (
                  <Form.Item
                    label="Describe the Issue"
                    name={`issue_description_${field.unique_id}`}
                    rules={
                      field.Did_you_Face_any_Technical_Issue.conditional_textbox.mandatory
                        ? [{ required: true, message: "Please describe the issue" }]
                        : []
                    }
                  >
                    <Input placeholder={field.Did_you_Face_any_Technical_Issue.conditional_textbox.placeholder} />
                  </Form.Item>
                )}
              </div>
            ))}

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit Feedback
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </>
  );
};

export default FeedbackForm;
