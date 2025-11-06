"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Typography,
  Card,
  Row,
  Col,
} from "antd";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useTestStore from "@/store/evaluate/teststore";
import { FormInstance } from "antd/lib/form";
import styles from "./general.module.css";
import AppLayout from "@/components/evaluate/layout";
import useAppStore from "@/store/class/user/userDetails";
import dayjs from "dayjs";

const { Title } = Typography;

interface FormField {
  field_id: string;
  field_name: string;
  field_description: string;
  component: "text" | "date" | "dropdown";
  placeholder: string;
  required: boolean;
  field_group: string;
  colspan?: number;
  rowsource?: string;
}

interface MasterData {
  [key: string]: {
    data: { key: string; value: string }[];
  };
}

type GeneralDataResponse = {
  test_id: string;
  general_data: FormField[] | string;
  master_data: MasterData | string;
};

const GeneralPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [masterData, setMasterData] = useState<MasterData>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [groupedFields, setGroupedFields] = useState<{
    [key: string]: FormField[];
  }>({});
  const [formValues, setFormValues] = useState<any[]>([]);

  const userId = session?.user?.id;
  const { testId } = useTestStore();
  const formRef = useRef<FormInstance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/evaluate/general?test_id=${testId}`);
        // router.push("/evaluate/instructions")
        const data: GeneralDataResponse = await response.json();

        const parsedGeneralData = Array.isArray(data.general_data)
          ? data.general_data
          : JSON.parse(data.general_data as string);
        const parsedMasterData =
          typeof data.master_data === "string"
            ? JSON.parse(data.master_data as string)
            : data.master_data;
            if (parsedGeneralData==null){
              router.push("/evaluate/instructions"); 
            }

        setFormFields(parsedGeneralData);
        setMasterData(parsedMasterData);

        const grouped = parsedGeneralData.reduce(
          (acc: { [key: string]: FormField[] }, field: FormField) => {
            (acc[field.field_group] = acc[field.field_group] || []).push(field);
            return acc;
          },
          {}
        );

        setGroupedFields(grouped);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [testId]);

  const handleFormSubmit = async () => {
    if (formRef.current) {
      try {
        const values = await formRef.current.validateFields();
        const updatedValues = Object.keys(values)
          .map((key) => {
            const field = formFields.find((field) => field.field_name === key);
            if (field) {
              return {
                field_description: field.field_description,
                field_group: field.field_group,
                value: values[key],
              };
            }
            return null;
          })
          .filter(Boolean);

        const allValues = [...formValues, ...updatedValues];
        const data = {
          test_id: testId,
          user_id: userId,
          data: allValues,
        };

        const response = await fetch("/api/evaluate/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to submit form");
        }

        router.push("/evaluate/instructions");
      } catch (error) {
        message.error("Form submission failed. Please try again.");
      }
    }
  };

  const handleNextPage = async () => {
    if (formRef.current) {
      try {
        const values = await formRef.current.validateFields();
        const updatedValues = Object.keys(values)
          .map((key) => {
            const field = formFields.find((field) => field.field_name === key);
            if (field) {
              return {
                field_description: field.field_description,
                field_group: field.field_group,
                value: values[key],
              };
            }
            return null;
          })
          .filter(Boolean); // Remove null values

        // Accumulate form data as user navigates pages
        setFormValues((prevValues) => [...prevValues, ...updatedValues]);

        if (currentPage === totalPages - 1) {
          await handleFormSubmit();
        } else {
          setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
        }
      } catch (errorInfo) {
        message.error("Please fill in all required fields.");
      }
    }
  };

  const getRowSource = (field: FormField) => {
    if (field.rowsource) {
      const datasetEntry = Object.values(masterData).find(
        (item: any) => item.dataset === field.rowsource
      );
      if (datasetEntry && Array.isArray(datasetEntry.data)) {
        return datasetEntry.data.map((option) => (
          <Select.Option key={option.key} value={option.key}>
            {option.value}
          </Select.Option>
        ));
      }
    }
    return <Select.Option disabled>No options available</Select.Option>;
  };

  const createRowLayout = (fields: FormField[]) => {
    const rows: FormField[][] = [];
    let currentRow: FormField[] = [];
    let currentColspan = 0;

    fields.forEach((field) => {
      const doubledColspan = (field.colspan || 4) * 2;
      if (currentColspan + doubledColspan <= 24) {
        currentRow.push({ ...field, colspan: doubledColspan });
        currentColspan += doubledColspan;
      } else {
        rows.push(currentRow);
        currentRow = [{ ...field, colspan: doubledColspan }];
        currentColspan = doubledColspan;
      }
    });

    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
  };

  const totalPages = Object.keys(groupedFields).length;

  return (
  
      <div className={styles["page-container"]}>
        <Form layout="vertical" onFinish={handleFormSubmit} ref={formRef}>
          {Object.keys(groupedFields).map(
            (groupKey, index) =>
              index === currentPage && (
                <Card key={`form-${index}`} className={styles["card"]}>
                  <header className={styles["title"]}>{groupKey}</header>
                  {createRowLayout(groupedFields[groupKey]).map(
                    (row, rowIndex) => (
                      <Row
                        gutter={16}
                        key={rowIndex}
                        className={styles["fields"]}
                      >
                        {row.map((field) => (
                          <Col key={field.field_id} span={field.colspan}>
                            <Form.Item
                              label={field.field_description}
                              name={field.field_name}
                              rules={[
                                {
                                  required: field.required,
                                  message: `Please Enter ${field.field_description}`,
                                },
                                ...(field.field_description.toLowerCase() ===
                                "mobile number"
                                  ? [
                                      {
                                        pattern: /^[0-9]{10}$/,
                                        message:
                                          "Invalid Mobile Number. Please enter a 10-digit number.",
                                      },
                                    ]
                                  : []),
                              ]}
                            >
                              {field.component === "text" ? (
                                <Input
                                  placeholder={field.placeholder}
                                  style={{ width: "100%" }}
                                />
                              ) : field.component === "date" ? (
                                <DatePicker
                                  placeholder={field.placeholder}
                                  style={{ width: "100%" }}
                                  disabledDate={
                                    field.field_description.toLowerCase() ===
                                    "date of birth"
                                      ? (current) =>
                                          current &&
                                          current.isAfter(dayjs(), "day")
                                      : undefined
                                  }
                                  onChange={(date, dateString) => {
                                    if (
                                      field.field_description.toLowerCase() ===
                                      "date of birth"
                                    ) {
                                      console.log(
                                        "Formatted Date:",
                                        dayjs(date).format("YYYY-MM-DD")
                                      );
                                    }
                                  }}
                                  format="YYYY-MM-DD"
                                />
                              ) : field.component === "dropdown" ? (
                                <Select
                                  placeholder={field.placeholder}
                                  style={{ width: "100%" }}
                                >
                                  {getRowSource(field)}
                                </Select>
                              ) : null}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    )
                  )}
                  <div className={styles["buttons"]}>
                    {currentPage === totalPages - 1 ? (
                      <Button
                        htmlType="submit"
                        className={styles["submit-button"]}
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextPage}
                        className={styles["next-button"]}
                      >
                        Next Page
                      </Button>
                    )}
                  </div>
                </Card>
              )
          )}
        </Form>
      </div>

  );
};

export default GeneralPage;
