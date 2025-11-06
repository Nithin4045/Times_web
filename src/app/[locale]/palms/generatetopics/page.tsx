"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import { Button, message, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { prisma } from '@/lib/prisma';

export default function ConceptMapping() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [conceptFile, setConceptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        message.error("Please upload a valid PDF file.");
        return;
      }
      setPdfFile(file);
    }
  };

  const handleConceptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isExcelOrCsv = file.type.includes("spreadsheetml") || file.name.endsWith(".csv");
      if (!isExcelOrCsv) {
        message.error("Please upload a valid Excel or CSV file.");
        return;
      }
      setConceptFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!pdfFile || !conceptFile) {
      return message.error("Please upload both PDF and concept files.");
    }

    const user_id = session?.user.id;
    const formData = new FormData();
    formData.append("mcqfile", pdfFile);
    formData.append("conceptfile", conceptFile);
    if (user_id) {
      formData.append('user_id', user_id.toString());
    } else {
      console.warn('⚠️ No user_id found in session, skipping user_id append');
    }
    try {
      setLoading(true);
      const res = await fetch("/api/palms/seperateconcept", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(result.error || "Server error");

      message.success("Concept mapping generated successfully.");
      console.log("Mapped Questions:", result.mappedQuestions);
    } catch (err) {
      console.error("❌ Error:", err);
      message.error("Generation failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div>
        <div className="MainTitle">CONCEPT MAPPING</div>
      </div>
      <div className={styles.container}>
        <div className={styles.uploadSection}>
          <label htmlFor="pdf-upload-input" className={styles.uploadLabel}>
            <Button icon={<UploadOutlined />} onClick={() => document.getElementById('pdf-upload-input')?.click()}>
              Upload MCQ PDF
            </Button>
            <input
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              id="pdf-upload-input"
              onChange={handlePdfUpload}
            />
          </label>
          {pdfFile && <span className={styles.fileName}>{pdfFile.name}</span>}
        </div>

        <div className={styles.uploadSection}>
          <label htmlFor="concept-upload-input" className={styles.uploadLabel}>
            <Button icon={<UploadOutlined />} onClick={() => document.getElementById('concept-upload-input')?.click()}>
              Upload Concepts File
            </Button>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              style={{ display: 'none' }}
              id="concept-upload-input"
              onChange={handleConceptUpload}
            />
          </label>
          {conceptFile && <span className={styles.fileName}>{conceptFile.name}</span>}
        </div>

        <Button
          type="primary"
          onClick={handleGenerate}
          className={styles.generateBtn}
          disabled={!pdfFile || !conceptFile}
        >
          Generate
        </Button>

        {loading && <Spin tip="Generating MCQ Mapping..." style={{ marginTop: 20 }} />}
      </div>
    </div>
  );
}
