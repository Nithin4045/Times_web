"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Select, Typography } from "antd";

const { Title } = Typography;

type resource = {
  test_id?: any;
  subject_id?: any;
  question_count?: any;
  duration_min?: any;
  rendering_order?: any;
  selection_method?: any;
  TOPIC_ID?: any;
  REQUIRE_RESOURCE?: any;
  complexity?: any;
  subject_marks?: any;
};

const AddResource: React.FC = () => {
  const [newResource, setNewResource] = useState<resource | undefined>();
  const [data, setData] = useState<any[]>([]);  // State to store fetched data
  const [loading, setLoading] = useState<boolean>(true);  // State for loading spinner

  const router = useRouter();

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Form submitted with data:", newResource); // Log the resource data before sending

    try {
      const response = await fetch("/api/evaluate/Admin/AddTestRepositoryDetails/AddNewQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource),
      });

      console.log("Response received:", response); // Log the response

      if (!response.ok) {
        const errorData = await response.json(); // Retrieve error details if any
        console.error("Error details:", errorData); // Log error details
      
      }

      // Redirect to the resource list page after successful submission
      console.log("Resource created successfully, navigating to resource list.");
    } catch (err) {
      console.error("Error during submission:", err); // Log any error that occurs
    }
  };

 // Fetch test repository details on component mount
 useEffect(() => {
    const fetchTestRepositoryDetails = async () => {
      try {
        const response = await fetch("/api/evaluate/Admin/AddTestRepositoryDetails/AddNewQuestions");
        if (response.ok) {
          const result = await response.json();
          setData(result);  // Set data from the API response
        } else {
          console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);  // Stop loading spinner after fetch is completed
      }
    };

    fetchTestRepositoryDetails();
  }, []);




  // Handle changes to form fields
  const handleChange = (key: string, value: any) => {
    console.log(`Changed ${key} to ${value}`); // Log each change made to the fields

    setNewResource((prevResource) => ({
      ...prevResource,
      [key]: value,
    }));
  };

  return (
    <div className="container">
      <h2 style={{lineHeight:2.5}}>Add New Test Repository Details</h2>
      <Form layout="vertical"  onFinish={handleSubmit}>
        {/* Test ID */}
        <Form.Item label="Test ID" required>
          <Input
            value={newResource?.test_id}
            onChange={(e) => handleChange("test_id", e.target.value)}
          />
        </Form.Item>

        {/* Subject ID */}
        <Form.Item label="Subject ID" required>
          <Input
            value={newResource?.subject_id}
            onChange={(e) => handleChange("subject_id", e.target.value)}
          />
        </Form.Item>

        {/* Question Count */}
        <Form.Item label="Question Count" required>
          <Input
            value={newResource?.question_count}
            onChange={(e) => handleChange("question_count", e.target.value)}
          />
        </Form.Item>

        {/* Duration (in minutes) */}
        <Form.Item label="Duration (min)" required>
          <Input
            value={newResource?.duration_min}
            onChange={(e) => handleChange("duration_min", e.target.value)}
          />
        </Form.Item>

        {/* Rendering Order */}
        <Form.Item label="Rendering Order" required>
          <Input
            value={newResource?.rendering_order}
            onChange={(e) => handleChange("rendering_order", e.target.value)}
          />
        </Form.Item>

        {/* Selection Method */}
        <Form.Item label="Selection Method" required>
          <Input
            value={newResource?.selection_method}
            onChange={(e) => handleChange("selection_method", e.target.value)}
          />
        </Form.Item>


        {/* Topic ID */}
        <Form.Item label="Topic ID" required>
          <Input
            value={newResource?.TOPIC_ID}
            onChange={(e) => handleChange("TOPIC_ID", e.target.value)}
          />
        </Form.Item>

        {/* Require Resource */}
        <Form.Item label="Require Resource" required>
          <Input
            value={newResource?.REQUIRE_RESOURCE}
            onChange={(e) => handleChange("REQUIRE_RESOURCE", e.target.value)}
          />
        </Form.Item>

        {/* Complexity */}
        <Form.Item label="Complexity" required>
          <Input
            value={newResource?.complexity}
            onChange={(e) => handleChange("complexity", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Subject Marks" required>
          <Input
            value={newResource?.subject_marks}
            onChange={(e) => handleChange("subject_marks", e.target.value)}
          />
        </Form.Item>
        {/* Submit Button */}
        <Form.Item>
          <div className="button-container">
            <Button className="primary-btn" type="primary" htmlType="submit">
              Create Resource
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddResource;
