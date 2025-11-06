import React, { useRef, useState } from "react";
import styles from "./twofileuploader.module.css";
import { Button, Typography } from "antd";
import clsx from "clsx";

const { Title, Text } = Typography;

interface TwoFileUploaderProps {
  titleText: string;
  subtitleText: string;
  buttonLabel1: string;
  buttonLabel2: string;
  fileTypes1: string[];
  fileTypes2: string[];
  maxSizeMB?: number;
  onFilesSelected: (file1: File | null, file2: File | null) => void;
  actionButtonLabel?: string;
  onActionButtonClick?: () => void;
  className?: string;
}

export default function TwoFileUploader({
  titleText,
  subtitleText,
  buttonLabel1,
  buttonLabel2,
  fileTypes1,
  fileTypes2,
  maxSizeMB = 10,
  onFilesSelected,
  actionButtonLabel,
  onActionButtonClick,
  className,
}: TwoFileUploaderProps) {
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const filterFile = (file: File | null, fileTypes: string[]) => {
    if (!file) return null;
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (fileTypes.includes(ext)) {
      return file;
    } else {
      alert(`Invalid file type: ${file.name}. Allowed: ${fileTypes.join(', ')}`);
      return null;
    }
  };

  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const validFile = filterFile(file, fileTypes1);
    setFile1(validFile);
    onFilesSelected(validFile, file2);
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const validFile = filterFile(file, fileTypes2);
    setFile2(validFile);
    onFilesSelected(file1, validFile);
  };

  return (
    <div
      className={clsx(styles.uploadContainer, className, dragOver && styles.dragActive)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        // Drag/drop not supported for two files, so ignore
      }}
    >
      <div className={styles.innerBox}>
        <div className={styles.uploadIcon}>📤</div>
        <Title level={4} className={styles.title}>{titleText}</Title>
        <Text className={styles.subtitle}>{subtitleText}</Text>
        <div className={styles.buttonRow}>
          <div className={styles.uploadSection}>
            <Button type="primary" className={styles.uploadButton} onClick={e => { e.stopPropagation(); fileInputRef1.current?.click(); }}>{buttonLabel1}</Button>
            <input
              type="file"
              accept={fileTypes1.join(",")}
              ref={fileInputRef1}
              onChange={handleFileChange1}
              className={styles.hiddenInput}
            />
            {file1 && <div className={styles.fileName}>{file1.name}</div>}
          </div>
          <div className={styles.uploadSection}>
            <Button type="primary" className={styles.uploadButton} onClick={e => { e.stopPropagation(); fileInputRef2.current?.click(); }}>{buttonLabel2}</Button>
            <input
              type="file"
              accept={fileTypes2.join(",")}
              ref={fileInputRef2}
              onChange={handleFileChange2}
              className={styles.hiddenInput}
            />
            {file2 && <div className={styles.fileName}>{file2.name}</div>}
          </div>
        </div>
        <Text className={styles.maxSizeText}>
          Maximum file size: {maxSizeMB}MB · 2 files required
        </Text>
        {actionButtonLabel && onActionButtonClick && (
          <button
            className={styles.actionButton}
            type="button"
            onClick={onActionButtonClick}
            style={{ marginTop: 24, width: 180, fontWeight: 600, fontSize: 16 }}
          >
            {actionButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
