
import React from 'react';
import { Layout, Menu } from 'antd';
// import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/images/evaluate/Pragmatiq_Full_logo.png';
import styles from '@/assets/styles/evaluate/layout.module.css'

const { Header, Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Layout className={styles.contentmain}>
      {/* Header */}
      

      {/* Main Content */}
      <Content className={styles.content}>
        {children}
      </Content>

      {/* Footer */}
      {/* <div className={styles.footer}>
        <p className={styles.textMuted}>
          <small className={styles.footerSmall}>
            (C) {new Date().getFullYear()}, Pragmatiq Systems Inc - All rights reserved. Pragmatiq Evaluation Portal
          </small>
        </p>
      </div> */}
    </Layout>
  );
};

export default AppLayout;
