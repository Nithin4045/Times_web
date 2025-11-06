"use client";

import React from "react";
import { Modal, Button, Space, message } from "antd";

interface ReplicateModalProps {
  open: boolean;
  onCancel: () => void;
  onReplicate: () => void;
  loading?: boolean;
}

export default function ReplicateModal({
  open,
  onCancel,
  onReplicate,
  loading = false,
}: ReplicateModalProps) {
  const handleReplicate = () => {
    onReplicate();
  };

  return (
    <Modal
      title="Confirm Replication"
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="replicate" type="primary" onClick={handleReplicate} loading={loading}>
          Start Replication
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <p style={{ marginBottom: 16, fontSize: 15, lineHeight: 1.6 }}>
            You are about to start the replication process. This will create variations of the selected questions using the configured prompts.
          </p>
          <p style={{ marginBottom: 0, fontSize: 14, color: "#666" }}>
            The process will apply transformation rules to generate new questions while maintaining the same conceptual structure and difficulty level.
          </p>
        </div>
      </Space>
    </Modal>
  );
}
