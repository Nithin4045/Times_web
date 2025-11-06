'use client';

import { useState } from 'react';
import { Button, Flex, Input, Modal } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function VocabGeneratorPage() {
  const [words, setWords] = useState('');
  const [hobby, setHobby] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const user_id = session?.user?.id || "";

      const formData = new FormData();
      formData.append('words', words);
      formData.append('hobby', hobby);
      // formData.append('user_id', user_id);

      const res = await fetch('/api/palms/generate-vocabulory', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate vocabulary questions');
      }

      setResult(data.questions);
      setModalTitle('Vocabulary Generated');
      setModalMessage('Vocabulary questions were generated successfully.');
      
      // Redirect immediately after successful completion
      router.push('/palms/listofaiquestions');
      
    } catch (error: any) {
      setResult(null);
      setModalTitle('Generation Failed');
      setModalMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      // Only show modal for errors, not for success
      if (!result) {
        setModalVisible(true);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="MainTitle">VOCABULARY GENERATOR</div>
      </div>

      <div className='page-subtitle'>Enter a list of words and a hobby and it generates content based on the provided words and hobby.</div>

      <div style={{ maxWidth: 600 }}>
        <Flex vertical gap={22}>
          <TextArea
            rows={4}
            placeholder="Enter a word"
            value={words}
            onChange={(e) => setWords(e.target.value)}
          />

          <Input
            placeholder="Enter a hobby or topic (e.g., cricket, cooking)"
            value={hobby}
            onChange={(e) => setHobby(e.target.value)}
          />

          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            style={{ width: 220 }}
          >
            {loading ? 'Generating...' : 'Generate Questions'}
          </Button>

        </Flex>
      </div>

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => setModalVisible(false)}
        title={modalTitle}
        footer={[
          <Button key="ok" type="primary" onClick={() => setModalVisible(false)}>
            OK
          </Button>,
        ]}
      >
        <p>{modalMessage}</p>
      </Modal>
    </div>
  );
}
