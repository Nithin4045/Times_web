'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Spin } from 'antd';
import "@/app/global.css";
import FileUploader from "@/components/common/FileUploader";
import { useSession } from "next-auth/react";

const VideoUploadPage = () => {
  const [uploadedBlob, setUploadedBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const router = useRouter();
  const { data: session } = useSession();

  const showMessage = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleUpload = async (file?: Blob, numQuestions?: number) => {
    const blobToUpload = file || uploadedBlob;
    const actualCount = numQuestions ?? questionCount;

    if (!blobToUpload) {
      showMessage('No video uploaded.');
      return;
    }

    setIsLoading(true);
    setModalVisible(false);
    setModalMessage('');
    try {
      const user_id = session?.user.id;
      const extension = blobToUpload.type.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      let videoFilename = (blobToUpload as File)?.name || `upload.${extension}`;
      formData.append('file', blobToUpload, videoFilename);
      formData.append('input_type', 'video');
      formData.append('num_questions', actualCount.toString());
      if (user_id) {
        formData.append('user_id', user_id.toString());
      }
      const response = await fetch('/api/palms/generate', {
        method: 'POST',
        body: formData,
      });
      console.log('Response:', response);
      if (!response.ok) {
        throw new Error('Failed to upload or process the video.');
      }
      // On success, navigate to listofaiquestions
      router.push('/palms/listofaiquestions');
    } catch (error) {
      console.error('Upload failed:', error);
      showMessage('Failed to upload or process the video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Spin spinning={isLoading} tip="Processing video...">
        <div style={{ padding: '20px' }}>
          <div>
            <div className='MainTitle'>UPLOAD VIDEO FOR TRANSCRIPTION</div>
          </div>
          <div className='page-subtitle'>Upload a video MP4 video to generate questions based on the video content.</div>
          <FileUploader
            titleText="Drag & drop your video here"
            subtitleText="or click to browse from your computer"
            buttonLabel="Select Video File"
            fileTypes={[".mp4", ".webm"]}
            maxSizeMB={1500}
            maxFiles={1}
            visible={!!uploadedBlob}
            done={false}
            sliderValue={questionCount}
            onSliderChange={setQuestionCount}
            showBottomButton={true}
            bottomButtonLabel="Upload & Process Video"
            onBottomButtonClick={() => {
              if (!uploadedBlob) {
                showMessage('No file selected.');
                return;
              }
              handleUpload(uploadedBlob, questionCount);
            }}
            onFilesSelected={(files) => {
              if (!files || files.length === 0) {
                showMessage('No file selected.');
                return;
              }
              const file = files[0];
              if (!file) {
                showMessage('No file selected.');
                return;
              }
              const validTypes = ['video/mp4', 'video/webm'];
              const validExts = ['.mp4', '.webm'];
              const fileName = file.name ? file.name.toLowerCase() : '';
              const isValid = validTypes.includes(file.type) || validExts.some(ext => fileName.endsWith(ext));
              if (file && isValid) {
                setUploadedBlob(file);
              } else {
                showMessage('Please upload a valid MP4 or WebM video.');
              }
            }}
          />
        </div>
      </Spin>
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        title="Video to Question Generation"
      >
        <p style={{ fontSize: 16, fontWeight: 500 }}>
          {modalMessage}
        </p>
      </Modal>
    </>
  );
};

export default VideoUploadPage;
