'use client';

import {
  ScissorOutlined,
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Image as AntImage,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Skeleton,
  Slider,
  Space,
  Typography,
  Upload,
  Spin,
  Alert,
} from 'antd';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import styles from './page.module.css';

const MAX_UPLOAD_MB = 5;

type User = {
  id: number;
  id_card_no: string;
  email: string;
  mobile: string;
  photo: string;
  firstname: string;
  lastname: string;
  address: string;
  // Course enrollment details
  batch_id: number | null;
  batch_code: string | null;
  city_id: number | null;
  city_name: string | null;
  center_id: number | null;
  center_name: string | null;
  variant_id: number | null;
  variant_name: string | null;
  course_id: number | null;
  course_name: string | null;
};

type AreaPixels = { x: number; y: number; width: number; height: number };

/** Load an image to get its natural width/height */
function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = reject;
    img.src = src;
  });
}

/** Canvas crop util: circular PNG with transparent corners (robust toBlob) */
async function getCroppedCirclePNG(
  imageSrc: string,
  cropPixels: AreaPixels,
  targetSize = 512
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // circular mask
  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.save();
  ctx.beginPath();
  const r = targetSize / 2;
  ctx.arc(r, r, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  // draw crop region scaled into the canvas
  ctx.drawImage(
    img,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, targetSize, targetSize
  );
  ctx.restore();

  // Robust export: toDataURL → fetch → blob
  const dataUrl = canvas.toDataURL('image/png', 1);
  const res = await fetch(dataUrl);
  return await res.blob();
}

export default function ProfilePage() {
  const [form] = Form.useForm<User>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // image/crop state
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);   // data URL for cropped result
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null); // cropped blob (not uploaded yet)

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawObjectUrl, setRawObjectUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<AreaPixels | null>(null);

  // session id card
  const { data: session } = useSession();
  const sessionIdCardNo = (session?.user as any)?.id_card_no as string | undefined;

  const load = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const data: { success: boolean; user: User } = await res.json();

      if (!data?.user) throw new Error('No profile data returned');

      setUser(data.user);
      form.setFieldsValue(data.user);

      // reset crop state
      if (rawObjectUrl) URL.revokeObjectURL(rawObjectUrl);
      setRawObjectUrl(null);
      setPreviewUrl(null);
      setSelectedBlob(null);
      setImgError(false);
    } catch (err: any) {
      console.error('[Profile load] error:', err);
      setErrorText(err?.message || 'Failed to load profile');
      message.error(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('cropModalOpen state changed to:', cropModalOpen);
  }, [cropModalOpen]);

  const onCropComplete = useCallback((_area: any, pixels: AreaPixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const startCropFromFile = (file: File) => {
    console.log('startCropFromFile called with file:', file.name, file.type, file.size);
    
    const fileSizeMB = file.size / 1024 / 1024;
    console.log('File size in MB:', fileSizeMB);
    
    const isUnderLimit = fileSizeMB <= MAX_UPLOAD_MB;
    if (!isUnderLimit) {
      console.log('File too large!');
      message.error(`File too large. Max ${MAX_UPLOAD_MB} MB allowed. Your file is ${fileSizeMB.toFixed(2)} MB.`);
      return;
    }
    if (!/^image\//.test(file.type)) {
      console.log('Not an image file!');
      message.error('Only image files are allowed.');
      return;
    }
    
    console.log('File validation passed, creating object URL...');
    if (rawObjectUrl) URL.revokeObjectURL(rawObjectUrl);
    const objUrl = URL.createObjectURL(file);
    console.log('Created object URL:', objUrl);
    setRawObjectUrl(objUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    console.log('Setting crop modal to open...');
    setCropModalOpen(true);
    console.log('Crop modal state should now be true');
  };

  const confirmCrop = async () => {
    try {
      if (!rawObjectUrl) return;

      let area = croppedAreaPixels;

      // Fallback: if user didn’t move/zoom (no onCropComplete yet), crop center square
      if (!area) {
        const { width, height } = await loadImageDimensions(rawObjectUrl);
        const size = Math.min(width, height);
        area = {
          x: Math.max(0, (width - size) / 2),
          y: Math.max(0, (height - size) / 2),
          width: size,
          height: size,
        };
      }

      const blob = await getCroppedCirclePNG(rawObjectUrl, area, 512);
      setSelectedBlob(blob);

      // preview as data URL
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(String(reader.result));
      reader.readAsDataURL(blob);

      setImgError(false);
      setCropModalOpen(false);
    } catch (e: any) {
      console.error('[Profile crop] error:', e);
      message.error('Failed to crop image');
    }
  };

  const cancelCrop = () => {
    setCropModalOpen(false);
    // keep previous preview if any
  };

  const onSave = async () => {
    const hide = message.loading('Updating profile...', 0);
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Add user identifier (required by API)
      const payload = {
        ...values,
        email: user?.email,
        id_card_no: user?.id_card_no,
      };

      if (selectedBlob) {
        if (selectedBlob.size / 1024 / 1024 > MAX_UPLOAD_MB) {
          message.error(`Cropped image is larger than ${MAX_UPLOAD_MB} MB, choose a smaller area or image.`);
          setSaving(false);
          hide();
          return;
        }

        const effectiveIdCardNo = sessionIdCardNo || user?.id_card_no || 'profile';
        const fd = new FormData();
        const fileForUpload = new File([selectedBlob], `${effectiveIdCardNo}.png`, { type: 'image/png' });
        fd.append('file', fileForUpload);
        fd.append('folder', 'profile');
        fd.append('filename', effectiveIdCardNo);

        // Upload to /api/upload (server writes to /uploads/profile/<id>.png)
        const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const status = uploadRes.status;
          if (status === 413) throw new Error(`File too large. Max ${MAX_UPLOAD_MB} MB allowed.`);
          const detail = await uploadRes.json().catch(() => ({} as any));
          throw new Error(detail?.error || `Upload failed (${status})`);
        }

        const bust = Date.now();
        const servedUrl = `/api/uploads/profile/${encodeURIComponent(effectiveIdCardNo)}.png?ts=${bust}`;
        payload.photo = servedUrl;
      }

      console.log('Saving profile with payload:', payload);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Save failed with response:', errorData);
        throw new Error(errorData?.error || `Save failed (${res.status})`);
      }
      
      const data = await res.json();

      hide();
      message.success('Profile updated successfully!');
      setUser(data.user);
      form.setFieldsValue(data.user);

      if (rawObjectUrl) URL.revokeObjectURL(rawObjectUrl);
      setRawObjectUrl(null);
      setPreviewUrl(null);
      setSelectedBlob(null);
      setImgError(false);
    } catch (err: any) {
      console.error('[Profile save] error:', err);
      hide();
      message.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // only use Upload to open file dialog; no auto-upload
  const uploadProps: UploadProps = {
    name: 'file',
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      startCropFromFile(file);
      return false; // prevent auto upload
    },
    customRequest: () => {
      // Do nothing - we handle upload manually
    },
  };

  const photoUrlFromDb = form.getFieldValue('photo');
  const effectivePhoto = previewUrl || photoUrlFromDb || '';
  const showImage = !!effectivePhoto && !imgError;

  function ProfileSkeleton() {
    return (
      <>
        {/* Banner skeleton */}
        <div className={styles.banner}>
          <div className={styles.avatarWrap}>
            <Skeleton.Avatar active size={100} shape="circle" />
            <Skeleton.Button active size="small" className={styles.skelAvatarBtn} />
          </div>

          <div className={styles.nameBlock}>
            <div className={styles.nameLine}>
              <Skeleton.Input active style={{ width: 220, height: 24 }} />
            </div>
            <div className={styles.metaLine}>
              <Skeleton.Input active size="small" style={{ width: 120 }} />
              <span>•</span>
              <Skeleton.Input active size="small" style={{ width: 160 }} />
            </div>
          </div>
        </div>

        {/* Form skeleton */}
        <div className={styles.formBox}>
          <Row gutter={[20, 12]}>
            <Col xs={24} md={12}>
              <div className={styles.formItemSkeleton}>
                <div className={styles.formLabelSkel}><Skeleton.Input active size="small" style={{ width: 90 }} /></div>
                <Skeleton.Input active block style={{ height: 38 }} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className={styles.formItemSkeleton}>
                <div className={styles.formLabelSkel}><Skeleton.Input active size="small" style={{ width: 90 }} /></div>
                <Skeleton.Input active block style={{ height: 38 }} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className={styles.formItemSkeleton}>
                <div className={styles.formLabelSkel}><Skeleton.Input active size="small" style={{ width: 70 }} /></div>
                <Skeleton.Input active block style={{ height: 38 }} />
              </div>
            </Col>
            <Col span={24}>
              <div className={styles.formItemSkeleton}>
                <div className={styles.formLabelSkel}><Skeleton.Input active size="small" style={{ width: 80 }} /></div>
                <Skeleton.Input active block style={{ height: 86 }} />
              </div>
            </Col>
          </Row>
        </div>
      </>
    );
  }


  return (
    <div className={styles.wrapper} aria-busy={saving}>
      {/* Local overlay spinner (no fullscreen/fixed) */}
      {saving && (
        <div className={styles.blockingOverlay}>
          <Spin tip="Updating..." indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
      )}

      <div className={styles.header}>
        <Typography.Title level={3} className={styles.title}>My Profile</Typography.Title>
        <button 
          className={styles["save-btn"]} 
          onClick={onSave}
          disabled={loading || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <Card className={styles.card} styles={{ body: { padding: 0 } }}>
        {loading ? (
          <ProfileSkeleton />
        ) : errorText ? (
        <div className={styles.skeletonBox}>
          <Alert type="error" message="Failed to load profile" description={errorText} showIcon />
        </div>
        ) : !user ? (
        <div className={styles.skeletonBox}>
          <Alert type="warning" message="No profile data available" showIcon />
        </div>
        ) : (
        <>
          {/* Banner */}
          <div className={styles.banner}>
            <div className={styles.avatarWrap}>
              {showImage ? (
                <AntImage
                  src={effectivePhoto}
                  alt="Profile"
                  width={100}
                  height={100}
                  preview={{ mask: 'Click to preview' }}
                  className={styles.avatarImg}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Avatar size={100} icon={<UserOutlined />} className={styles.avatarAnt} />
              )}

              <Upload {...uploadProps} disabled={saving}>
                <Button size="small" className={styles.avatarBtn} icon={<UploadOutlined />} disabled={saving}>
                  {previewUrl ? 'Change Selected' : 'Change Photo'}
                </Button>
              </Upload>
            </div>

            <div className={styles.nameBlock}>
              <div className={styles.nameLine}>
                <span className={styles.nameText}>
                  {form.getFieldValue('firstname')} {form.getFieldValue('lastname')}
                </span>
              </div>
              <div className={styles.metaLine}>
                <span>ID: <b>{user.id_card_no}</b></span>
                <span>•</span>
                <span>Email: <b>{user.email}</b></span>
              </div>
              {user.course_name && (
                <div className={styles.metaLine} style={{ marginTop: 8 }}>
                  <span>Course: <b>{user.course_name}</b></span>
                  {user.variant_name && (
                    <>
                      <span>•</span>
                      <span>Variant: <b>{user.variant_name}</b></span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className={styles.formBox}>
            <Form form={form} layout="vertical" className={styles.form} disabled={saving}>
              <Typography.Title level={5} style={{ marginBottom: 16 }}>Personal Information</Typography.Title>
              <Row gutter={[20, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item name="firstname" label="First Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="lastname" label="Last Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="mobile" label="Mobile" rules={[{ required: true }]}>
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* Course Enrollment Details Section */}
              {user.batch_id && (
                <>
                  <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Course Enrollment Details</Typography.Title>
                  <Row gutter={[20, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Batch Code">
                        <Input value={user.batch_code || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Course Name">
                        <Input value={user.course_name || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Variant">
                        <Input value={user.variant_name || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="City">
                        <Input value={user.city_name || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Center">
                        <Input value={user.center_name || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Batch ID">
                        <Input value={user.batch_id?.toString() || 'N/A'} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </Form>
          </div>
        </>
        )}
      </Card>

      {/* Crop Modal */}
      <Modal
        open={cropModalOpen}
        title={<Space><ScissorOutlined /> Crop Profile Photo</Space>}
        onOk={confirmCrop}
        onCancel={cancelCrop}
        okText="Crop"
        destroyOnHidden
        maskClosable={false}
        okButtonProps={{ disabled: saving }}
        cancelButtonProps={{ disabled: saving }}
        width={800}
        zIndex={2000}
      >
        <div style={{ position: 'relative', width: '100%', height: 500, background: '#111', borderRadius: 12, overflow: 'hidden' }}>
          {rawObjectUrl && (
            <Cropper
              image={rawObjectUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              restrictPosition
            />
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">Zoom</Typography.Text>
          <Slider min={1} max={3} step={0.01} value={zoom} onChange={setZoom} disabled={saving} />
        </div>
        <Typography.Paragraph type="secondary" style={{ marginTop: 6 }}>
          Tip: Drag or zoom the image to adjust the crop, then press <b>Crop</b>.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
