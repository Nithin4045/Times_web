'use client'

import { useState, useEffect, useRef } from 'react';
import { Input, InputNumber, Button, Typography, Space, Spin, Progress, List, Alert, Modal } from 'antd';
import styles from './page.module.css';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { TextArea } = Input;

export default function QuestionsFromTextPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showMaxQuestionsModal, setShowMaxQuestionsModal] = useState(false);

  useEffect(() => {
    if (loading) {
      // After 3 seconds, navigate to listofaiquestions
      loadingTimeoutRef.current = setTimeout(() => {
        router.push('/palms/listofaiquestions');
      }, 3000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    // Cleanup on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [loading, router]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value);
  const handleNumChange = (value: number | null) => {
    if (!value) {
      setNumQuestions(1);
    } else if (value > 100) {
      setShowMaxQuestionsModal(true);
      // Do not update numQuestions, keep previous value
    } else {
      setNumQuestions(value);
    }
  };

  const handleGenerate = async () => {
    // Prevent spinner and generation if above limit
    console.log('numQuestions', numQuestions);
    if (numQuestions > 100) {
      setShowMaxQuestionsModal(true);
      return;
    }
    setLoading(true);
    setQuestions([]);
    setError(null);
    setShowJobModal(false);
    setJobId(null);
    let gotFirstQuestion = false;
    try {
      const uuid = uuidv4();
      const fileName = `${uuid}.txt`;
      const textFile = new File([text], fileName, { type: 'text/plain' });
      // Read file as base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(textFile);
      });
      const formData = new FormData();
      formData.append('fileBase64', fileBase64);
      formData.append('fileName', fileName);
      formData.append('file_type', 'text');
      const userId = session?.user?.id ? Number(session.user.id) : 0;
      formData.append('user_id', userId.toString());
      formData.append('num_questions', numQuestions.toString());
      formData.append('file', textFile);
      // If you want to add a prompt, add here: formData.append('prompt', prompt)
      const res = await fetch('/api/palms/text-to-mcqs', {
        method: 'POST',
        body: formData,
      });
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      let buffer = '';
      setQuestions([]);
      let localJobId: string | null = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.startsWith('data:')) {
            try {
              const json = JSON.parse(part.replace('data:', '').trim());
              if (json.job_id && !localJobId) {
                localJobId = json.job_id;
                setJobId(localJobId);
              }
              if (json.error) {
                setError(json.error);
                setLoading(false);
                return;
              }
              if (json.data) {
                setQuestions(qs => {
                  const newQs = [...qs, json.data];
                  if (newQs.length === numQuestions) {
                    setShowJobModal(true);
                  }
                  return newQs;
                });
                if (!gotFirstQuestion) {
                  setLoading(false); // Stop spinner on first valid question
                  gotFirstQuestion = true;
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
      // If no questions were received, stop loading at the end
      if (!gotFirstQuestion) setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom:20 }}>
        <div className="MainTitle">Questions from Text</div>
      </div>
      <div className={styles.antContainer}>
        <TextArea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste or type your text here..."
          rows={18}
          style={{ width: '100%', minHeight: 300, padding: 16, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box', overflow: 'auto' }}
        />
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>
            Number of Questions:
            <InputNumber
              min={1}
              // no max, allow user to type any value
              value={numQuestions}
              onChange={handleNumChange}
              style={{ marginLeft: 8, width: 80 }}
            />
          </span>
          <Button type="primary" size="large" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Questions'}
          </Button>
        </Space>
        {/* Loading Spinner (no modal, no background) */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Generating questions...</div>
          </div>
        )}
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        {showJobModal && (
          <Modal open={showJobModal} onCancel={() => setShowJobModal(false)} footer={null} centered>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Job Complete</div>
            <div>Your job ID is: <b>{jobId}</b></div>
            <div style={{ marginTop: 12 }}>You can use this ID to track or view your generated questions.</div>
          </Modal>
        )}
        {showMaxQuestionsModal && (
          <Modal open={showMaxQuestionsModal} onCancel={() => setShowMaxQuestionsModal(false)} footer={null} centered>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Too Many Questions</div>
            <div>You can generate a maximum of 100 questions at a time. Please reduce the number and try again.</div>
          </Modal>
        )}
      </div>
    </div>
  );
}
  