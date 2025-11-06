import React, { useRef, useState, useEffect } from "react";
import styles from "./FileUploader.module.css";
import { Button, Typography, Slider, message, Spin } from "antd";
import clsx from "clsx";

const { Title, Text } = Typography;

interface FileUploaderProps {
  titleText: string;
  subtitleText: string;
  buttonLabel: string;
  fileTypes: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  visible?: boolean;
  done?: boolean;
  sliderValue?: number;
  onSliderChange?: (value: number) => void;
  showButton?: boolean;
  onButtonClick?: () => void;
  showBottomButton?: boolean;
  bottomButtonLabel?: string;
  onBottomButtonClick?: () => void;
  clearFiles?: boolean;
}

// Helper function to format file size
const formatFileSize = (sizeInMB: number): string => {
  if (sizeInMB >= 1000) {
    const sizeInGB = (sizeInMB / 1024).toFixed(1);
    return `${sizeInGB}GB`;
  }
  return `${sizeInMB.toFixed(1)}MB`;
};

// Helper function to convert bytes to MB
const bytesToMB = (bytes: number): number => {
  return bytes / (1024 * 1024);
};

export default function FileUploader({
  titleText,
  subtitleText,
  buttonLabel,
  fileTypes,
  maxSizeMB = 10,
  maxFiles = 1,
  onFilesSelected,
  className,
  visible = false,
  done = false,
  sliderValue = 1,
  onSliderChange = () => { },
  showButton = false,
  onButtonClick = () => { },
  showBottomButton = false,
  bottomButtonLabel = "Bottom Button",
  onBottomButtonClick = () => { },
  clearFiles = false,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragRejected, setDragRejected] = useState(false);
  const [showLongProcess, setShowLongProcess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Always clear drag states when errorMessage is set
  useEffect(() => {
    if (errorMessage) {
      setDragOver(false);
      setDragRejected(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (clearFiles) {
      setSelectedFile(null);
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [clearFiles]);

  const filterFiles = (files: File[]) => {
    console.log('[FileUploader] filterFiles called with:', files);
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    const oversizedFiles: File[] = [];

    files.forEach((file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const fileSizeMB = bytesToMB(file.size);

      console.log('[FileUploader] Checking file:', file.name, 'Extension:', ext, 'Size:', fileSizeMB, 'MB');

      // Check file type
      if (!fileTypes.includes(ext)) {
        invalidFiles.push(file);
        return;
      }

      // Check file size
      if (fileSizeMB > maxSizeMB) {
        oversizedFiles.push(file);
        return;
      }

      validFiles.push(file);
    });

    // Show warnings for invalid files
    if (invalidFiles.length > 0) {
      console.warn('[FileUploader] Invalid file(s):', invalidFiles.map(f => f.name));
      message.warning(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}. Allowed: ${fileTypes.join(', ')}`);
    }

    // Show error for oversized files and prevent selection
    if (oversizedFiles.length > 0) {
      console.warn('[FileUploader] Oversized file(s):', oversizedFiles.map(f => f.name));
      const maxSizeFormatted = formatFileSize(maxSizeMB);
      const errorMsg = `File "${oversizedFiles[0].name}" is too large (${formatFileSize(bytesToMB(oversizedFiles[0].size))}). Maximum size allowed: ${maxSizeFormatted}`;
      message.error(errorMsg);
      setErrorMessage(errorMsg);
      setDragOver(false);
      setDragRejected(false);
      // Clear the file input to prevent the file from being selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return [];
    }

    // If valid file(s) selected, also reset drag states
    setDragOver(false);
    setDragRejected(false);

    console.log('[FileUploader] Valid files:', validFiles.map(f => f.name));
    return validFiles.slice(0, maxFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setDragRejected(false);

    // Always reset drag states on new file drop
    setDragOver(false);
    setDragRejected(false);

    // Check file size before processing
    const files = Array.from(e.dataTransfer.files);
    const oversizedFiles = files.filter(file => bytesToMB(file.size) > maxSizeMB);

    if (oversizedFiles.length > 0) {
      // Show error message for oversized files
      const maxSizeFormatted = formatFileSize(maxSizeMB);
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      const errorMsg = `File size limit exceeded: ${fileNames}. Maximum size allowed: ${maxSizeFormatted}`;
      message.error(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    // @ts-ignore
    const validFiles = filterFiles(files);
    setDragOver(false); // Always reset drag state
    setDragRejected(false); // Always reset drag state
    console.log('[FileUploader] handleDrop files:', validFiles);
    if (validFiles.length > 0) {
      const file = validFiles[0];
      setSelectedFile({ name: file.name, size: file.size });
      onFilesSelected(validFiles);
    } else {
      // Clear selected file if no valid files
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    if (!e.target.files) {
      console.warn('[FileUploader] No files in input');
      setDragOver(false); // <-- Reset drag state
      setDragRejected(false); // <-- Reset drag state
      return;
    }
    // @ts-ignore
    const files = filterFiles(Array.from(e.target.files));
    setDragOver(false); // Always reset drag state
    setDragRejected(false); // Always reset drag state
    console.log('[FileUploader] handleFileChange files:', files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile({ name: file.name, size: file.size });
      setErrorMessage(null); // Clear any previous error messages
      onFilesSelected(files);
    } else {
      // Clear selected file if no valid files
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Check if any files being dragged exceed the size limit
    const files = Array.from(e.dataTransfer.files);
    const oversizedFiles = files.filter(file => bytesToMB(file.size) > maxSizeMB);

    if (oversizedFiles.length > 0) {
      // Don't allow drop if files are too large
      e.dataTransfer.dropEffect = 'none';
      setDragOver(false);
      setDragRejected(true);
    } else {
      setDragOver(true);
      setDragRejected(false);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setDragRejected(false);
  };

  return (
    <div
      className={clsx(
        styles.uploadContainer,
        className,
        dragOver && styles.dragActive,
        dragRejected && !errorMessage && styles.dragRejected,
        errorMessage && styles.errorState
      )}
      onDrop={errorMessage ? undefined : handleDrop}
      onDragOver={errorMessage ? undefined : handleDragOver}
      onDragLeave={errorMessage ? undefined : handleDragLeave}
    >
      <div className={styles.innerBox}>
        {errorMessage ? (
          <>
            <div className={styles.uploadIcon} style={{ color: '#ff4d4f' }}>⚠️</div>
            <Title level={4} className={styles.title} style={{ color: '#ff4d4f' }}>
              File Size Limit Exceeded
            </Title>
            <Text className={styles.subtitle} style={{ color: '#ff4d4f' }}>
              {errorMessage}
            </Text>
            <Button
              type="primary"
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: 16 }}
            >
              {buttonLabel}
            </Button>
            <input
              type="file"
              accept={fileTypes.join(",")}
              multiple={maxFiles > 1}
              ref={fileInputRef}
              onChange={handleFileChange}
              className={styles.hiddenInput}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <>
            {dragRejected ? (
              <>
                <div className={styles.uploadIcon} style={{ color: '#ff4d4f' }}>⚠️</div>
                <Title level={4} className={styles.title} style={{ color: '#ff4d4f' }}>
                  File Size Limit Exceeded
                </Title>
                <Text className={styles.subtitle} style={{ color: '#ff4d4f' }}>
                  The file you're trying to upload is too large. Maximum size allowed: {formatFileSize(maxSizeMB)}
                </Text>
              </>
            ) : (
              <>
                <div className={styles.uploadIcon}>📤</div>
                <Title level={4} className={styles.title}>{titleText}</Title>
                <Text className={styles.subtitle}>{subtitleText}</Text>
              </>
            )}
            <Button
              type="primary"
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              {buttonLabel}
            </Button>
            <Text className={styles.maxSizeText}>
              Maximum file size: {formatFileSize(maxSizeMB)} · Max files: {maxFiles}
            </Text>
            <input
              type="file"
              accept={fileTypes.join(",")}
              multiple={maxFiles > 1}
              ref={fileInputRef}
              onChange={handleFileChange}
              className={styles.hiddenInput}
              style={{ display: 'none' }}
            />
            {selectedFile && (
              <div style={{ margin: '12px 0', color: '#722ed1', fontWeight: 500, fontSize: 15 }}>
                Selected file: {selectedFile.name} ({formatFileSize(bytesToMB(selectedFile.size))})
              </div>
            )}
            {/* Slider only visible if visible is true and not done */}
            {visible && !done && (
              <div className={styles.sliderContainer}>
                <label htmlFor="fileUploaderSlider" className={styles.sliderLabel}>Select number of questions</label>
                <Slider
                  id="fileUploaderSlider"
                  min={1}
                  max={100}
                  value={sliderValue}
                  onChange={(value) => {
                    onSliderChange(value); // ✅ Only update value here
                  }}
                  marks={{ 1: '1', 10: '10', 25: '25', 50: '50' }}
                  step={1}
                  tooltip={{ open: true }}
                  style={{ width: 320, margin: '16px auto' }}
                />

                <div className={styles.sliderSelected}>Selected: {sliderValue}</div>
              </div>
            )}
            {showButton && (
              <Button
                type="primary"
                className={styles.uploadButton}
                style={{ width: '100%', marginTop: 16 }}
                onClick={onButtonClick}
                disabled={!!errorMessage}
              >
                {buttonLabel}
              </Button>
            )}
            {showBottomButton && (
              <Button
                type="default"
                className={styles.bottomButton}
                style={{ width: '100%', marginTop: 24 }}
                onClick={onBottomButtonClick}
              >
                {bottomButtonLabel}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Overlay loading spinner and long process message */}
      {showLongProcess && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Spin tip="Processing..." size="large" />
            <div style={{ marginTop: 24, fontWeight: 500, color: '#722ed1', fontSize: 18 }}>
              Processing is taking time. Please wait for a while.<br />After completion, we will notify you.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
