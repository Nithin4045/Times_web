


'use client';
import React from 'react';
import { Card, Typography } from 'antd';
import styles from './thankyou.module.css'; // Import the updated CSS file
import AppLayout from "@/components/evaluate/layout";
import InternetSpeedBadge from '@/components/evaluate/internetSpeedMeter';

const { Title, Paragraph } = Typography;

const Thankyou: React.FC = () => {
  return (
 <>
      <InternetSpeedBadge />
      <div className={styles["thankyou-container"]}>
        <Card className={styles["thankyou-card"]}>
          <Title level={1} className={styles["thankyou-title"]}>Thank you!</Title>
          <Paragraph>
            Dear User, Thank you for taking the assessment. This is part of continuous evaluation during your current course.
          </Paragraph>
          <Paragraph>
            You will be notified of results in subsequent learning sessions.
          </Paragraph>
        </Card>
      </div>
      </>
  );
};

export default Thankyou;
