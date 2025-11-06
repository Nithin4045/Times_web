"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Select, Typography } from "antd";

const { Title } = Typography;

type Resource = {
  SUBJECT_ID?: any;
  TOPIC_ID?: any;
  QUESTION_NUMBER?: any;
  CHOICE1?: any;
  CHOICE2?: any;
  CHOICE3?: any;
  CHOICE4?: any;
  ANSWER?: any;
  COMPLEXITY?: any;
  QUESTION_SOURCE?: any;
  LINK?: any;
  QUESTION_TYPE?: any;
  PARENT_QUESTION_NUMBER?: any;
  QUESTION?: any;
  Help_text?: any;
  HELP_FILES?: any;
  OPTIONS?: any;
  negative_marks?: any;
  RESOURCE_CODE?: any;
  RESOURCE?: any;
  RESOURCE_TYPE?: any;
  RESOURCE_FILES?: any;
};

const AddResource: React.FC = () => {
  const [newResource, setNewResource] = useState<Resource | undefined>();
  const [data, setData] = useState<any[]>([]);  // State to store fetched data
  const [loading, setLoading] = useState<boolean>(true);  // State for loading spinner

  const router = useRouter();

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Form submitted with data:", newResource); // Log the resource data before sending

    try {
      const response = await fetch("/api/evaluate/Admin/AddQuestions/AddNewQuestions", {
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
      <h2 style={{lineHeight:2.5}}>Add Questions</h2>
      <Form layout="vertical"  onFinish={handleSubmit}>
        {/* SUBJECT_ID */}
        <Form.Item label="Subject ID" required>
          <Input
            value={newResource?.SUBJECT_ID}
            onChange={(e) => handleChange("SUBJECT_ID", e.target.value)}
          />
        </Form.Item>

        {/* TOPIC_ID */}
        <Form.Item label="Topic ID" required>
          <Input
            value={newResource?.TOPIC_ID}
            onChange={(e) => handleChange("TOPIC_ID", e.target.value)}
          />
        </Form.Item>

        {/* QUESTION_NUMBER */}
        <Form.Item label="Question Number" required>
          <Input
            value={newResource?.QUESTION_NUMBER}
            onChange={(e) => handleChange("QUESTION_NUMBER", e.target.value)}
          />
        </Form.Item>

        {/* CHOICE1 */}
        <Form.Item label="Choice 1" required>
          <Input
            value={newResource?.CHOICE1}
            onChange={(e) => handleChange("CHOICE1", e.target.value)}
          />
        </Form.Item>

        {/* CHOICE2 */}
        <Form.Item label="Choice 2" required>
          <Input
            value={newResource?.CHOICE2}
            onChange={(e) => handleChange("CHOICE2", e.target.value)}
          />
        </Form.Item>

        {/* CHOICE3 */}
        <Form.Item label="Choice 3" required>
          <Input
            value={newResource?.CHOICE3}
            onChange={(e) => handleChange("CHOICE3", e.target.value)}
          />
        </Form.Item>

        {/* CHOICE4 */}
        <Form.Item label="Choice 4" required>
          <Input
            value={newResource?.CHOICE4}
            onChange={(e) => handleChange("CHOICE4", e.target.value)}
          />
        </Form.Item>

        {/* ANSWER */}
        <Form.Item label="Answer" required>
          <Input
            value={newResource?.ANSWER}
            onChange={(e) => handleChange("ANSWER", e.target.value)}
          />
        </Form.Item>

        {/* COMPLEXITY */}
        <Form.Item label="Complexity" required>
          <Input
            value={newResource?.COMPLEXITY}
            onChange={(e) => handleChange("COMPLEXITY", e.target.value)}
          />
        </Form.Item>

        {/* QUESTION_SOURCE */}
        <Form.Item label="Question Source" required>
          <Input
            value={newResource?.QUESTION_SOURCE}
            onChange={(e) => handleChange("QUESTION_SOURCE", e.target.value)}
          />
        </Form.Item>

        {/* LINK */}
        <Form.Item label="Link" required>
          <Input
            value={newResource?.LINK}
            onChange={(e) => handleChange("LINK", e.target.value)}
          />
        </Form.Item>

        {/* QUESTION_TYPE */}
        <Form.Item label="Question Type" required>
          <Input
            value={newResource?.QUESTION_TYPE}
            onChange={(e) => handleChange("QUESTION_TYPE", e.target.value)}
          />
        </Form.Item>

        {/* PARENT_QUESTION_NUMBER */}
        <Form.Item label="Parent Question Number" required>
          <Input
            value={newResource?.PARENT_QUESTION_NUMBER}
            onChange={(e) => handleChange("PARENT_QUESTION_NUMBER", e.target.value)}
          />
        </Form.Item>

        {/* QUESTION */}
        <Form.Item label="Question" required>
          <Input
            value={newResource?.QUESTION}
            onChange={(e) => handleChange("QUESTION", e.target.value)}
          />
        </Form.Item>

        {/* Help_text */}
        <Form.Item label="Help Text" required>
          <Input
            value={newResource?.Help_text}
            onChange={(e) => handleChange("Help_text", e.target.value)}
          />
        </Form.Item>

        {/* HELP_FILES */}
        <Form.Item label="Help Files" required>
          <Input
            value={newResource?.HELP_FILES}
            onChange={(e) => handleChange("HELP_FILES", e.target.value)}
          />
        </Form.Item>

        {/* OPTIONS */}
        <Form.Item label="Options" required>
          <Input
            value={newResource?.OPTIONS}
            onChange={(e) => handleChange("OPTIONS", e.target.value)}
          />
        </Form.Item>

        {/* negative_marks */}
        <Form.Item label="Negative Marks" required>
          <Input
            value={newResource?.negative_marks}
            onChange={(e) => handleChange("negative_marks", e.target.value)}
          />
        </Form.Item>

        {/* RESOURCE_CODE */}
        <Form.Item label="Resource Code" required>
          <Input
            value={newResource?.RESOURCE_CODE}
            onChange={(e) => handleChange("RESOURCE_CODE", e.target.value)}
          />
        </Form.Item>

        {/* RESOURCE */}
        <Form.Item label="Resource" required>
          <Input
            value={newResource?.RESOURCE}
            onChange={(e) => handleChange("RESOURCE", e.target.value)}
          />
        </Form.Item>

        {/* RESOURCE_TYPE */}
        <Form.Item label="Resource Type" required>
          <Input
            value={newResource?.RESOURCE_TYPE}
            onChange={(e) => handleChange("RESOURCE_TYPE", e.target.value)}
          />
        </Form.Item>

        {/* RESOURCE_FILES */}
        <Form.Item label="Resource Files" required>
          <Input
            value={newResource?.RESOURCE_FILES}
            onChange={(e) => handleChange("RESOURCE_FILES", e.target.value)}
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
