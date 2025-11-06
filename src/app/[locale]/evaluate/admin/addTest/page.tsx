"use client";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Checkbox,
  Select,
  Button,
  Flex,
  Modal,
} from "antd";
import Title from "antd/es/typography/Title";
import axios from "axios";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons/lib/icons";
import EvlEpiQuestion from "@/components/evaluate/test/EvlEpiQuestion";
import EvlGeneralQuestion from "@/components/evaluate/test/EvlGeneralQuestion";
import dayjs from "dayjs";
import "@/app/global.css";
import utc from 'dayjs/plugin/utc';
import { message } from "antd";
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

interface TestFormValues {
  TEST_ID: number;
  TEST_TYPE: string;
  TEST_DESCRIPTION: string;
  VALIDITY_START: any;
  VALIDITY_END: any;
  QUESTION_SELECTION_METHOD: string;
  STATUS: Number;
  TEST_CODE: string;
  TEST_TITLE: string;
  general_data: string;
  master_data: string;
  epi_question: string;
  video: Number;
  COLLEGE_CODE: string;
  COLLEGE_NAME: string;
  Module: number;
  LINK_TEST: number;
  ip_restriction: number;
  ip_addresses: string;

}

const TestForm: React.FC = () => {
  const [form] = Form.useForm<TestFormValues>();

  const [isGeneralDataModalVisible, setIsGeneralDataModalVisible] =
    useState(false);

  const [masterData, setMasterData] = useState([]);
  const [isEpiQuestionModalVisible, setIsEpiQuestionModalVisible] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptions, setDescriptions] = useState([]);

  const searchParams = useSearchParams();
  const test_id = searchParams.get("TEST_ID");

  const router = useRouter();

  // useEffect(() => {
  //   const fetchDescriptions = async () => {
  //     try {
  //       const res = await axios.get(
  //         `/api/evaluate/get_repository?TEST_ID=${test_id}`
  //       );
  //       const data = res?.data?.recordset;

  //       const record = data?.[0]; // assuming you still want to use the first record for form values
  //       if (record) {
  //         form.setFieldsValue({
  //           Module: record.Module,
  //           TEST_ID: record.TEST_ID,
  //           TEST_TYPE: record.TEST_TYPE,
  //           TEST_DESCRIPTION: record.TEST_DESCRIPTION,
  //           VALIDITY_START: record.VALIDITY_START
  //             ? dayjs.utc(record.VALIDITY_START)
  //             : null,
  //           VALIDITY_END: record.VALIDITY_END
  //             ? dayjs.utc(record.VALIDITY_END)
  //             : null,
  //           QUESTION_SELECTION_METHOD: record.QUESTION_SELECTION_METHOD,
  //           STATUS: record.STATUS,
  //           TEST_CODE: record.TEST_CODE,
  //           TEST_TITLE: record.TEST_TITLE,
  //           general_data: JSON.parse(record.general_data),

  //           epi_question: JSON.parse(record.epi_question),
  //           video: record.video,
  //           COLLEGE_CODE: record.COLLEGE_CODE,
  //           COLLEGE_NAME: record.COLLEGE_NAME,
  //           LINK_TEST: record.LINK_TEST,
  //           ip_restriction: record.IP_RESTRICTION,
  //           ip_addresses: record.IP_ADDRESSES
  //             ? JSON.parse(record.IP_ADDRESSES).join(",")
  //             : "",
  //         });
  //         setMasterData(JSON.parse(record.master_data));
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch data", error);
  //     }
  //   };
  //   fetchDescriptions();
  // }, [test_id]);

  // Add near the top of the file (if not already present)


// Replace the existing useEffect that fetches the record with this:
useEffect(() => {
  const fetchRecordSafely = async () => {
    if (!test_id) return;

    try {
      const res = await axios.get(`/api/evaluate/get_repository?TEST_ID=${encodeURIComponent(test_id)}`);
      console.log("get_repository raw response:", res?.data);

      // Support both shapes: { recordset: [...] } or [ ... ] or { ...single... }
      const payload = res?.data;
      let record: any = null;

      if (Array.isArray(payload)) {
        record = payload[0] ?? null;
      } else if (payload?.recordset && Array.isArray(payload.recordset)) {
        record = payload.recordset[0] ?? null;
      } else if (payload?.record) {
        record = payload.record;
      } else if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
        // server might have returned a single object directly
        record = payload;
      }

      if (!record) {
        console.warn("No record found for TEST_ID", test_id, "response:", res?.data);
        return;
      }

      // Normalize keys (accept uppercase or lowercase)
      const get = (kUpper: string, kLower?: string) =>
        record[kUpper] ?? (kLower ? record[kLower] : undefined) ?? record[kUpper.toLowerCase()];

      // safe JSON parse
      const safeJsonParse = (val: any, fallback: any = null) => {
        if (val == null || val === "") return fallback;
        if (typeof val !== "string") return val; // already parsed
        try {
          return JSON.parse(val);
        } catch (e) {
          console.warn("JSON.parse failed for value:", val, e);
          return fallback;
        }
      };

      // build form values with fallbacks and proper dayjs objects for DatePicker
      const formVals: any = {
        Module: get("Module", "module"),
        TEST_ID: get("TEST_ID", "test_id"),
        TEST_TYPE: get("TEST_TYPE", "test_type") ?? get("test_mode", "mode"),
        TEST_DESCRIPTION: get("TEST_DESCRIPTION", "test_description"),
        VALIDITY_START: get("VALIDITY_START", "validity_start")
          ? dayjs.utc(get("VALIDITY_START", "validity_start"))
          : null,
        VALIDITY_END: get("VALIDITY_END", "validity_end")
          ? dayjs.utc(get("VALIDITY_END", "validity_end"))
          : null,
        QUESTION_SELECTION_METHOD: get("QUESTION_SELECTION_METHOD", "question_selection_method"),
        STATUS: get("STATUS", "status"),
        TEST_CODE: get("TEST_CODE", "test_code"),
        TEST_TITLE: get("TEST_TITLE", "test_title") ?? get("test_title", "testTitle"),
        general_data: safeJsonParse(get("general_data", "general_data"), null),
        epi_question: safeJsonParse(get("epi_question", "epi_question"), null),
        video: get("video", "video"),
        COLLEGE_CODE: get("COLLEGE_CODE", "college_code"),
        COLLEGE_NAME: get("COLLEGE_NAME", "college_name"),
        LINK_TEST: get("LINK_TEST", "link_test") ?? get("LINK_TEST", "LINK_TEST"),
        ip_restriction: get("IP_RESTRICTION", "ip_restriction") ?? get("ip_restriction", "IP_RESTRICTION"),
        ip_addresses: (() => {
          const raw = get("IP_ADDRESSES", "ip_addresses") ?? get("ip_addresses", "IP_ADDRESSES");
          const parsed = safeJsonParse(raw, null);
          if (Array.isArray(parsed)) return parsed.join(",");
          if (typeof raw === "string" && raw.includes(",")) return raw;
          return parsed ?? raw ?? "";
        })(),
      };

      // If master_data stored as JSON string
      const masterRaw = get("master_data", "master_data") ?? get("MASTER_DATA", "MASTER_DATA");
      const masterParsed = safeJsonParse(masterRaw, []);
      setMasterData(masterParsed);

      // Set the form values
      console.log("Setting form values (normalized):", formVals);
      form.setFieldsValue(formVals);
    } catch (err) {
      console.error("Failed to fetch data", err);
      message.error("Failed to load test details for editing.");
    }
  };

  fetchRecordSafely();
}, [test_id]);

  
  useEffect(() => {
    const fetchDescriptions = async () => {
      try {
        const response = await axios.get(
          "/api/evaluate/get_repository/TestDescriptions"
        ); 
        setDescriptions(response.data);
      } catch (error) {
        console.error("Failed to fetch test descriptions:", error);
      }
    };

    fetchDescriptions();
  }, []);

  const handleGeneralDataSave = (data: any, masterData: any) => {
    // console.log(masterData, "masterData...");
    form.setFieldsValue({ general_data: data });
    setMasterData(masterData);
    setIsGeneralDataModalVisible(false);
  };

  const handleEpiQuestionSave = (data: any) => {
    // console.log(data, "kdsnksnkdsk data ");
    form.setFieldsValue({ epi_question: data });
    setIsEpiQuestionModalVisible(false);
  };
  const onFinish = async (values: TestFormValues) => {
    setIsSubmitting(true);

    const payload = {
      ...values,
      VALIDITY_START: values.VALIDITY_START?.format("YYYY-MM-DD HH:mm:ss"),
      VALIDITY_END: values.VALIDITY_END?.format("YYYY-MM-DD HH:mm:ss"),
      TEST_ID: values.TEST_ID || test_id || null,
      epi_question: JSON.stringify(values.epi_question),
      general_data: JSON.stringify(values.general_data),
      master_data: JSON.stringify(masterData),
      ip_restriction: values.ip_restriction,
      ip_addresses: values.ip_addresses
        ? JSON.stringify(
          values.ip_addresses
            .split(",")
            .map((ip: string) => ip.trim())
            .filter((ip: string) => ip.length > 0)
        )
        : null,
    };

    try {
      let response;

      if (test_id) {
        console.log("Updating test with ID:", test_id);
        response = await axios.put(`/api/evaluate/repository?TEST_ID=${test_id}`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        console.log("Creating new test");
        response = await axios.post("/api/evaluate/repository", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (response.status === 200) {
        console.log("Operation successful:", response.data);
        router.push("/evaluate/admin/addTestDetails");
      }
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        className="evl-addnewtest-container"
        style={{ marginTop: "68px", marginLeft: "10px", marginRight: "10px" }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <Button
            className="primary-btn"
            type="primary"
            style={{
              // marginLeft: "15px",
              marginTop: "20px",
              marginBottom: "20px",
              background: "#f3f4f2",
              color: "black",
              fontWeight: "bold",
            }}
            onClick={() => {
              router.push("/evaluate/admin/addTestDetails");
            }}
          >
            <ArrowLeftOutlined
              style={{ fontSize: "16px", fontWeight: "bold" }}
            />
          </Button>
          <div className='MainTitle'>ADD TEST</div>
        </div>
        {/* <Title level={4} className="pl-5 pt-5">
        <span className="typo-title">CREATE NEW TEST REPOSITORY</span>
      </Title> */}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Flex wrap="wrap" gap="16px" justify="space-between">
            <Form.Item
              name="TEST_CODE"
              label="Test Code"
              className="flex-item"
              rules={[{ required: true, message: "Please enter Test Code" }]}
              style={{ width: "350px" }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="TEST_TITLE"
              label="Test Title"
              className="flex-item"
              rules={[{ required: true, message: "Please enter Test Title" }]}
              style={{ width: "350px" }}
            >
              <Input />
            </Form.Item>

            {/* <Form.Item
            name="TEST_TYPE"
            label="Test Type"
            className="flex-item"
            rules={[{ required: true, message: "Please enter Test Type" }]}
            style={{ width: "350px" }}
          >
            <Input />
          </Form.Item> */}

            <Form.Item
              name="TEST_TYPE"
              label="Test Mode "
              className="flex-item"
              rules={[{ required: true, message: "Please select Test Mode" }]}
              style={{ width: "350px" }}
            >
              <Select placeholder="Select Test Mode">
                <Option value="SINGLE">Single</Option>
                <Option value="LOOP">Loop</Option>
              </Select>
            </Form.Item>
          </Flex>

          <Form.Item
            name="TEST_DESCRIPTION"
            label="Test Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={1} />
          </Form.Item>

          <Flex wrap="wrap" gap="16px" justify="space-between">
            <Form.Item
              name="VALIDITY_START"
              label="Validity Start"
              className="flex-item"
              rules={[{ required: true, message: "Select start date" }]}
              style={{ width: "300px" }}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="VALIDITY_END"
              label="Validity End"
              className="flex-item"
              rules={[{ required: true, message: "Select end date" }]}
              style={{ width: "300px" }}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="QUESTION_SELECTION_METHOD"
              label="Question Selection Method"
              className="flex-item"
              rules={[{ required: true, message: "Select question method" }]}
              style={{ width: "300px" }}
            >
              <Select style={{ width: "100%" }}>
                <Option value="random">Random</Option>
                <Option value="manual">Manual</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="STATUS"
              label="Status"
              className="flex-item"
              style={{ width: "300px" }}
              rules={[{ required: true, message: "Select status" }]}
            >
              <Select style={{ width: "100%" }}>
                {/* <Option value={2}>Select Option</Option> */}
                <Option value={1}>Active</Option>
                <Option value={0}>Inactive</Option>
              </Select>
            </Form.Item>
          </Flex>

          <Flex wrap="wrap" gap="16px" justify="space-between">
            <Form.Item
              name="COLLEGE_CODE"
              label="College Code"
              className="flex-item"
              rules={[{ required: true, message: "Enter college code" }]}
              style={{ width: "300px" }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="COLLEGE_NAME"
              label="College Name"
              className="flex-item"
              rules={[{ required: true, message: "Enter college name" }]}
              style={{ width: "300px" }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="general_data"
              label="General Data"
              className="flex-item"
              // rules={[{ required: true, message: "Please add general data" }]}
              style={{ width: "300px" }}
            >
              <Button onClick={() => setIsGeneralDataModalVisible(true)} block>
                Edit General Data
              </Button>
            </Form.Item>

            <Form.Item
              name="epi_question"
              label="EPI Question"
              className="flex-item"
              // rules={[{ required: true, message: "Please add EPI question" }]}
              style={{ width: "300px" }}
            >
              <Button onClick={() => setIsEpiQuestionModalVisible(true)} block>
                Edit EPI Question
              </Button>
            </Form.Item>
          </Flex>

          <EvlEpiQuestion
            isEpiQuestionModalVisible={isEpiQuestionModalVisible}
            handleEpiQuestionSave={handleEpiQuestionSave}
            setIsEpiQuestionModalVisible={setIsEpiQuestionModalVisible}
            epi_question={form.getFieldValue("epi_question")}
          />

          <EvlGeneralQuestion
            isGeneralDataModalVisible={isGeneralDataModalVisible}
            handleGeneralDataSave={handleGeneralDataSave}
            setIsGeneralDataModalVisible={setIsGeneralDataModalVisible}
            general_data={form.getFieldValue("general_data")}
            masterFromData={masterData}
          />

          <Flex wrap="wrap" gap="16px" justify="space-between">

            <Form.Item
              name="LINK_TEST"
              label="Link Test"
              className="flex-item"
              // rules={[{ required: true, message: "Please enter test link" }]}
              style={{ width: "300px" }}
            >
              {/* <Input /> */}
              <Select placeholder="Select coding test" allowClear>
                {descriptions.map((item: any) => (
                  <Option key={item.TEST_ID} value={item.TEST_ID}>
                    {item.TEST_CODE} - {item.TEST_TITLE}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="video"
              label="Video"
              className="flex-item"
              style={{ width: "300px" }}
            // rules={[{ required: true, message: "Please select an option" }]}
            >
              <Select placeholder="Select an option">
                <Option value={1}>Yes</Option>
                <Option value={0}>No</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="ip_restriction"
              label="IP Restriction"
              className="flex-item"
              style={{ width: "300px" }}
            >
              <Select placeholder="Select an option">
                <Option value={1}>Yes</Option>
                <Option value={0}>No</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="ip_addresses"
              label="IP Addresses"
              className="flex-item"
              rules={[{ required: false, message: "Enter ip addresses" }]}
              style={{ width: "300px" }}
            // rules={[{ required: true, message: "Please select an option" }]}
            >
              <Input placeholder="Enter IP addresses separated by commas"  />
            </Form.Item>
          </Flex>

          <Form.Item style={{ textAlign: "end" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="middle"
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{ backgroundColor: "#722ED1", borderColor: "#722ED1" }} // Purple
            >
              {test_id ? "Update" : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default TestForm;
