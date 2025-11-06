'use client';

import { useState, useRef, useEffect } from 'react';
import FileUploader from "@/components/common/FileUploader";
import { Spin } from 'antd';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function ExtractMCQsPage() {
  const [mcqFile, setMcqFile] = useState<File | null>(null);
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

  const handleExtractMCQs = async () => {
    if (!mcqFile || !session?.user.id) return;
    setLoading(true);
    
    try {
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(mcqFile);
      });
      
      const formData = new FormData();
      formData.append('fileBase64', fileBase64);
      formData.append('file_type', mcqFile.type);
      formData.append('user_id', session.user.id.toString());
      formData.append('fileName', mcqFile.name);

      const res = await fetch('/api/palms/extract-mcqs', {
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
      console.error('Error in handleExtractMCQs:', err);
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: 400, padding: '20px' }}>
      <div>
        <div className="MainTitle">EXTRACT MCQs FROM FILE</div>
      </div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>
        Upload a file containing multiple-choice questions to extract them.
      </div>
      <div style={{ marginBottom: 24 }}>
        <FileUploader
          titleText="Drag & drop your MCQ file here"
          subtitleText="or click to browse from your computer"
          buttonLabel="Select File"
          fileTypes={[".pdf", ".docx", ".rtf", ".txt"]}
          maxSizeMB={10}
          maxFiles={1}
          visible={!!mcqFile}
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
              setMcqFile(file);
            }
          }}
          showBottomButton={true}
          bottomButtonLabel="Extract MCQs"
          onBottomButtonClick={() => {
            handleExtractMCQs();
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
          <Spin tip="Extracting MCQs..." size="large" />
        </div>
      )}
    </div>
  );
} 