'use client';

import { useState, useRef, useEffect } from 'react';
import FileUploader from "@/components/common/FileUploader";
import { Spin } from 'antd';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only set a fallback timeout in case the streaming response doesn't complete properly
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Fallback timeout triggered - redirecting to questions list');
        setLoading(false);
        router.push('/palms/listofaiquestions');
      }, 30000); // 30 seconds fallback
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [loading, router]);

  const handleGenerateQuestions = async (numQuestions?: number) => {
    const actualCount = numQuestions ?? questionCount;
    if (!pdfFile || !actualCount || !session?.user.id) return;
    setLoading(true);
    
    try {
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });
      
      const formData = new FormData();
      formData.append('fileBase64', fileBase64);
      formData.append('file_type', pdfFile.type);
      formData.append('num_questions', actualCount.toString());
      formData.append('user_id', session.user.id.toString());
      formData.append('fileName', pdfFile.name);
      formData.append('file', pdfFile);

      const res = await fetch('/api/palms/text-to-mcqs', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 200) {
        console.log('Starting to handle streaming response...');
        // Handle streaming response
        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('Received streaming data:', data);
                
                // Check if we received an error
                if (data.error) {
                  console.error('Error from stream:', data.error);
                  setLoading(false);
                  return;
                }
                
                // Check if the stream is complete - when percent reaches 100 or we have data
                if (data.percent === 100 || (data.data && data.percent >= 90)) {
                  setLoading(false);
                  // Redirect immediately when streaming is complete
                  router.push('/palms/listofaiquestions');
                  return;
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
                console.log('Parse error for line:', line);
              }
            }
          }
        }

        // If we reach here, streaming is complete
        console.log('Streaming completed successfully');
        setLoading(false);
        router.push('/palms/listofaiquestions');
      } else {
        setLoading(false);
        console.error('API request failed:', res.status);
      }
    } catch (err) {
      console.error('Error in handleGenerateQuestions:', err);
      setLoading(false);
    }
  };

  return (
    <div>
        <div className="MainTitle">GENERATE QUESTIONS FROM PDF</div>

      <div className="page-subtitle" style={{ marginBottom: 24 }}>
        Upload a PDF to get started.
      </div>
      <div style={{ marginBottom: 24 }}>
        <FileUploader
          titleText="Drag & drop your PDF file here"
          subtitleText="or click to browse from your computer"
          buttonLabel="Select File"
          fileTypes={[".pdf", ".docx", ".rtf", ".txt"]}
          maxSizeMB={10}
          maxFiles={1}
          visible={!!pdfFile}
          sliderValue={questionCount || 5}
          onSliderChange={setQuestionCount}
          onFilesSelected={(files) => {
            const file = files[0];
            // Accept PDF, DOCX, RTF, and plain text
            const allowedTypes = [
              "application/pdf",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/rtf",
              "text/plain"
            ];
            if (file && allowedTypes.includes(file.type)) {
              setPdfFile(file);
              setQuestionCount(5);
            }
          }}
          showBottomButton={true}
          bottomButtonLabel="Generate Questions"
          onBottomButtonClick={() => {
            handleGenerateQuestions(questionCount || 5);
          }}
        />
      </div>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 10
        }}>
          <Spin tip="Processing..." size="large" />
        </div>
      )}
    </div>
  );
}
