"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import { message, Spin } from "antd";
import { useSession } from "next-auth/react";
import TwoFileUploader from "@/components/common/twofileuploader";

export default function ConceptMapping() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [conceptFile, setConceptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleFilesSelected = (file1: File | null, file2: File | null) => {
    setPdfFile(file1);
    setConceptFile(file2);
  };

  const handleGenerate = async () => {
    if (!pdfFile || !conceptFile) {
      return message.error("Please upload both MCQ and concept files.");
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
      const res = await fetch("/api/palms/question_tagging", {
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
        <TwoFileUploader
          titleText="Upload Files for Concept Mapping"
          subtitleText="Upload your MCQ file (PDF/DOCX/RTF/TXT) and concepts file (XLSX) to generate concept mapping"
          buttonLabel1="Upload MCQ File"
          buttonLabel2="Upload Concepts File"
          fileTypes1={[".pdf", ".docx", ".rtf", ".txt"]}
          fileTypes2={[".xlsx"]}
          maxSizeMB={10}
          onFilesSelected={handleFilesSelected}
          actionButtonLabel="Start Mapping"
          onActionButtonClick={handleGenerate}
          className={styles.uploaderContainer}
        />

        {loading && <Spin tip="Generating MCQ Mapping..." style={{ marginTop: 20 }} />}
      </div>
    </div>
  );
}
