'use client'
import TestSummary from "@/components/evaluate/instructionsPage";
import useTestStore from "@/store/evaluate/teststore";
import React from "react";
import { Button } from "antd"; 
import AppLayout from "@/components/evaluate/layout";
import "@/app/global.css"

const TestPage = () => {
  // Correctly access testId using Zustand's selector syntax
  const testId = useTestStore((state) => state.testId);
  console.log('testId from src\app\[locale]\evaluate\instructions\page.tsx:', testId);

  if (!testId) {
    return <div>Test ID not found.</div>; // Handle missing testId case
  }

  return (
   <>
     <div style={{ padding: '20px' }}>
      <TestSummary testId={testId} />
      <a href={`/evaluate/exam`}>
        <Button
        className="primary-btn"
          style={{
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          Agree & Continue
        </Button>
      </a>
      </div>
      </>
  );
};

export default TestPage;







