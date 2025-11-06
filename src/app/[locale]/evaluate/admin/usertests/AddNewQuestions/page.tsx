"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, DatePicker, Typography } from "antd";
import moment from "moment";

const { Title } = Typography;

type resource = {
  test_id?: any;
  VALIDITY_START?: any;
  VALIDITY_END?: any;
  USER_NAME?: any;
  access?: any;
  test_name?: any;
  user_data?: any;
  epi_data?: any;
  distCount?: any;
  distSecs?: any;
  video?: any;
  user_id?: any;
  BATCH_CODE?: any;
};

const AddResource: React.FC = () => {
  const [newResource, setNewResource] = useState<resource | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Form submitted with data:", newResource);

    try {
      const response = await fetch("/api/evaluate/Admin/usertests/AddNewQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource),
      });

      console.log("Response received:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        router.push('/evaluate/admin/TestRepository')
      }

      // Redirect to the resource list page after successful submission
      console.log("Resource created successfully, navigating to resource list.");
    } catch (err) {
      console.error("Error during submission:", err);
    }
  };

  // Handle changes to form fields
  const handleChange = (key: string, value: any) => {
    console.log(`Changed ${key} to ${value}`);
    setNewResource((prevResource) => ({
      ...prevResource,
      [key]: value,
    }));
  };

  return (
    <div className="container">
      <h2 style={{ lineHeight: 2.5 }}>Add Test Repository</h2>
      <Form layout="vertical"  onFinish={handleSubmit}>
        {/* Test ID */}
        <Form.Item label="Test ID" required>
          <Input
            value={newResource?.test_id}
            onChange={(e) => handleChange("test_id", e.target.value)}
          />
        </Form.Item>

        {/* Validity Start */}
        <Form.Item label="Validity Start" required>
          <DatePicker
            value={newResource?.VALIDITY_START ? moment(newResource.VALIDITY_START) : null}
            onChange={(date: moment.Moment | null) =>
              handleChange("VALIDITY_START", date ? date.format("YYYY-MM-DD") : null)
            }
            format="YYYY-MM-DD"
          />
        </Form.Item>

        {/* Validity End */}
        <Form.Item label="Validity End" required>
          <DatePicker
            value={newResource?.VALIDITY_END ? moment(newResource.VALIDITY_END) : null}
            onChange={(date: moment.Moment | null) =>
              handleChange("VALIDITY_END", date ? date.format("YYYY-MM-DD") : null)
            }
            format="YYYY-MM-DD"
          />
        </Form.Item>

        {/* User Name */}
        <Form.Item label="User Name" required>
          <Input
            value={newResource?.USER_NAME}
            onChange={(e) => handleChange("USER_NAME", e.target.value)}
          />
        </Form.Item>

        {/* Access */}
        <Form.Item label="Access" required>
          <Input
            value={newResource?.access}
            onChange={(e) => handleChange("access", e.target.value)}
          />
        </Form.Item>

        {/* Test Name */}
        <Form.Item label="Test Name" required>
          <Input
            value={newResource?.test_name}
            onChange={(e) => handleChange("test_name", e.target.value)}
          />
        </Form.Item>

        {/* User Data */}
        <Form.Item label="User Data" required>
          <Input
            value={newResource?.user_data}
            onChange={(e) => handleChange("user_data", e.target.value)}
          />
        </Form.Item>

        {/* EPI Data */}
        <Form.Item label="EPI Data" required>
          <Input
            value={newResource?.epi_data}
            onChange={(e) => handleChange("epi_data", e.target.value)}
          />
        </Form.Item>

        {/* Dist Count */}
        <Form.Item label="Dist Count" required>
          <Input
            value={newResource?.distCount}
            onChange={(e) => handleChange("distCount", e.target.value)}
          />
        </Form.Item>

        {/* Dist Secs */}
        <Form.Item label="Dist Secs" required>
          <Input
            value={newResource?.distSecs}
            onChange={(e) => handleChange("distSecs", e.target.value)}
          />
        </Form.Item>

        {/* Video */}
        <Form.Item label="Video" required>
          <Input
            value={newResource?.video}
            onChange={(e) => handleChange("video", e.target.value)}
          />
        </Form.Item>

        {/* User ID */}
        <Form.Item label="User ID" required>
          <Input
            value={newResource?.user_id}
            onChange={(e) => handleChange("user_id", e.target.value)}
          />
        </Form.Item>

        {/* Batch Code */}
        <Form.Item label="Batch Code" required>
          <Input
            value={newResource?.BATCH_CODE}
            onChange={(e) => handleChange("BATCH_CODE", e.target.value)}
          />
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <div className="button-container">
            <Button type="primary" htmlType="submit">
              Create Resource
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddResource;
