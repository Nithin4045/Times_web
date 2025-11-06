'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Spin, Alert } from 'antd';
import styles from '@/app/[locale]/id_card/page.module.css';
import { useSelectedCourse } from '@/store/selectedcourse';

type IdCardContentProps = {
  variant?: 'page' | 'modal';
};

function toBase64(str: string) {
  try {
    return typeof window !== 'undefined'
      ? btoa(unescape(encodeURIComponent(str)))
      : Buffer.from(str, 'utf8').toString('base64');
  } catch {
    return typeof window !== 'undefined'
      ? btoa(str)
      : Buffer.from(str, 'utf8').toString('base64');
  }
}

function getStudentFromSession(session: any, selectedCourse: any) {
  if (!session) return null;

  if (session.user?.student && typeof session.user.student === 'object') {
    return session.user.student;
  }

  const sj = session.user?.studentJson ?? session.user?.student_string;
  if (sj && typeof sj === 'string') {
    try {
      return JSON.parse(sj);
    } catch {
      return null;
    }
  }

  const u = session.user ?? {};
  const hasIdLike = !!(u?.id_card_no || u?.id || u?.email);
  const hasNameLike = !!(u?.firstname || u?.name || u?.email);

  if (!hasIdLike && !hasNameLike && !selectedCourse) return null;

  return {
    StudentID: u.id_card_no ?? u.id ?? u.email ?? 'Unknown ID',
    StudentName: u.firstname ?? u.name ?? u.email ?? 'Unknown Name',
    BatchName:
      selectedCourse?.batch_id ??
      u.BatchName ??
      u.batch ??
      u.batchName ??
      'Unknown Batch',
    Course:
      selectedCourse?.category_name ??
      u.Course ??
      u.course ??
      'Unknown Course',
    Usertype:
      selectedCourse?.course_name ?? u.Usertype ?? u.role ?? 'Unknown',
  };
}

function extractBatchId(candidate: any): number | null {
  if (!candidate) return null;

  const tries: Array<any> = [
    candidate.batch_id,
    candidate.batchId,
    candidate.id,
    candidate.batch?.id,
    candidate.batch?.batch_id,
  ];

  for (const t of tries) {
    if (t !== undefined && t !== null) {
      const num = typeof t === 'number' ? t : parseInt(String(t), 10);
      if (!isNaN(num)) return num;
    }
  }

  return null;
}

export default function IdCardContent({ variant = 'page' }: IdCardContentProps) {
  const { data: session, status } = useSession();
  const selectedCourse = useSelectedCourse((state) => state.selected);

  const student = useMemo(() => {
    const fromSession = getStudentFromSession(session, selectedCourse);
    if (fromSession) return fromSession;

    return {
      StudentID: 'HOAH5A008',
      StudentName: 'Shreya Tiwari',
      BatchName: 'XAT-25-OL_FLEXI',
      Course: 'XAT',
      Usertype: 'OMET25',
    };
  }, [session, selectedCourse]);

  const [batchCode, setBatchCode] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const batchIdToSend = useMemo(() => {
    const scAny: any = selectedCourse;
    const fromSelected = extractBatchId(scAny);
    if (fromSelected) return fromSelected;

    const userBatch = (session?.user as any)?.batch_id;
    if (userBatch) {
      const num = typeof userBatch === 'number' ? userBatch : parseInt(String(userBatch), 10);
      if (!isNaN(num)) return num;
    }

    return null;
  }, [selectedCourse, session]);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    async function fetchBatchCode() {
      if (!batchIdToSend) {
        setBatchCode(null);
        return;
      }

      setBatchLoading(true);
      setBatchError(null);

      try {
        const res = await fetch('/api/others/get_batch_code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batch_id: batchIdToSend }),
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.error || `Failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!aborted) {
          setBatchCode(String(data?.batch_code ?? student.BatchName));
        }
      } catch (error: any) {
        if (!aborted && error.name !== 'AbortError') {
          console.error('[ID CARD] Failed to fetch batch code', error);
          setBatchError(error?.message || 'Failed to load batch information');
          setBatchCode(null);
        }
      } finally {
        if (!aborted) setBatchLoading(false);
      }
    }

    fetchBatchCode();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [batchIdToSend, student.BatchName]);

  const studentForQr = useMemo(() => ({
    ...student,
    BatchCode: batchCode ?? student.BatchName,
  }), [student, batchCode]);

  const encoded = useMemo(() => toBase64(JSON.stringify(studentForQr)), [studentForQr]);

  const qrUrl = useMemo(
    () => `https://qrcode.tec-it.com/API/QRCode?chs=240x240&data=${encodeURIComponent(encoded)}`,
    [encoded]
  );

  useEffect(() => {
    console.group('[ID Card Data]');
    console.log('Session status:', status);
    console.log('Student data:', student);
    console.log('Batch ID to send:', batchIdToSend);
    console.log('Batch code:', batchCode);
    console.log('Batch loading:', batchLoading);
    if (batchError) console.error('Batch error:', batchError);
    console.groupEnd();
  }, [status, student, batchIdToSend, batchCode, batchLoading, batchError]);

  const containerStyle =
    variant === 'page'
      ? { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' as const }
      : { display: 'flex', alignItems: 'center', justifyContent: 'center' as const };

  if (batchLoading && !batchCode) {
    const spinner = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', width: '100%' }}>
        <Spin size="large" tip="Loading batch information..." />
      </div>
    );

    if (variant === 'page') {
      return (
        <main className={styles.page} style={containerStyle}>
          {spinner}
        </main>
      );
    }

    return spinner;
  }

  const cardContent = (
    <>
      <h1 className={styles.heading}>Student ID Card</h1>

      {batchError && (
        <Alert
          type="warning"
          message="Batch Information"
          description={`Could not load batch code. Displaying batch name instead. ${batchError}`}
          showIcon
          closable
        />
      )}

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.k}>Student ID</span>
          <span className={styles.v}>{student.StudentID}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>Name</span>
          <span className={styles.v}>{student.StudentName}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>Batch</span>
          <span className={styles.v}>
            {batchCode ? String(batchCode) : batchLoading ? 'Loading...' : String(student.BatchName)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>Course</span>
          <span className={styles.v}>{String(student.Course)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>User Type</span>
          <span className={styles.v}>{String(student.Usertype)}</span>
        </div>
      </div>

      <div className={styles.qrContainer}>
        <img
          src={qrUrl}
          alt={`QR code for ${student.StudentID}`}
          width={240}
          height={240}
          className={styles.qr}
        />
      </div>
    </>
  );

  if (variant === 'page') {
    return (
      <main className={styles.page} style={containerStyle}>
        <div className={styles.card}>
          {cardContent}
        </div>
      </main>
    );
  }

  // For modal variant, return content directly without card wrapper
  return <div style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>{cardContent}</div>;
}
