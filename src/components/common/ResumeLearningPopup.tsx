"use client";

import React from "react";
import { Modal, Button } from "antd";
import { PlayCircleOutlined, FileTextOutlined, FormOutlined, CameraOutlined, CheckSquareOutlined, FilePdfOutlined } from "@ant-design/icons";
import styles from "./ResumeLearningPopup.module.css";

interface LastActivity {
  video: {
    id: number | null;
    path: string | null;
    title: string | null;
  };
  material: {
    id: number | null;
    path: string | null;
    title: string | null;
    type: string | null;
  };
  test: {
    id: number | null;
    path: string | null;
    title: string | null;
  };
  lastUpdated: string | null;
}

interface ResumeLearningPopupProps {
  visible: boolean;
  onClose: () => void;
  lastActivity: LastActivity | null;
  onNavigate: (type: 'video' | 'material' | 'test', path: string) => void;
}

const ResumeLearningPopup: React.FC<ResumeLearningPopupProps> = ({
  visible,
  onClose,
  lastActivity,
  onNavigate
}) => {
  const hasVideo = lastActivity?.video?.path || lastActivity?.video?.id;
  const hasMaterial = lastActivity?.material?.path || lastActivity?.material?.id;
  const hasTest = lastActivity?.test?.path || lastActivity?.test?.id;

  const handleStart = (type: 'video' | 'material' | 'test') => {
    let path = '';

    if (type === 'video' && lastActivity?.video?.path) {
      path = lastActivity.video.path;
    } else if (type === 'material' && lastActivity?.material?.path) {
      path = lastActivity.material.path;
    } else if (type === 'test' && lastActivity?.test?.path) {
      path = lastActivity.test.path;
    }

    if (path) {
      onNavigate(type, path);
      onClose();
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      className={styles.resumeModal}
      closable={true}
    >
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Resume Your Learning</h2>
        <p className={styles.modalSubtitle}>
          <strong>Welcome back!</strong> Here's what you were last working on – pick up right where you left off:
        </p>

        <div className={styles.activityList}>
          {/* Video Topic */}
          <div className={styles.activityItem}>
            <div className={styles.activityIconWrapper}>
              <CameraOutlined className={styles.activityIcon} />
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityLabel}>Topic: </span>
              <span className={styles.activityTitle}>
                {hasVideo && lastActivity?.video?.title
                  ? lastActivity.video.title
                  : "Probability Basics - Level 1"}
              </span>
            </div>
            <Button
              type="primary"
              className={styles.startBtn}
              disabled={!hasVideo}
              onClick={() => handleStart('video')}
            >
              Start
            </Button>
          </div>

          {/* Test */}
          <div className={styles.activityItem}>
            <div className={styles.activityIconWrapper}>
              <CheckSquareOutlined className={styles.activityIcon} />
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityLabel}>Test: </span>
              <span className={styles.activityTitle}>
                {hasTest && lastActivity?.test?.title
                  ? lastActivity.test.title
                  : "Arithmetic Practice Test - Time & Work"}
              </span>
            </div>
            <Button
              type="primary"
              className={styles.startBtn}
              disabled={!hasTest}
              onClick={() => handleStart('test')}
            >
              Start
            </Button>
          </div>

          {/* Material/PDF */}
          <div className={styles.activityItem}>
            <div className={styles.activityIconWrapper}>
              <FilePdfOutlined className={styles.activityIcon} />
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityTitle}>
                {hasMaterial && lastActivity?.material?.title
                  ? lastActivity.material.title
                  : "Algebra Shortcuts - PDF Guide"}
              </span>
            </div>
            <Button
              type="primary"
              className={styles.startBtn}
              disabled={!hasMaterial}
              onClick={() => handleStart('material')}
            >
              Start
            </Button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button
            type="primary"
            className={styles.guideMeBtn}
            onClick={onClose}
          >
            Keep Guiding Me
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeLearningPopup;
