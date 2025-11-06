"use client";
import { Card, Typography, Row, Col } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <UserOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2}>Admin Dashboard</Title>
              <Text style={{ fontSize: '18px', color: '#666' }}>
                Currently Under Development
              </Text>
              <div style={{ marginTop: '24px' }}>
                <Text type="secondary">
                  This dashboard will contain administrative features and analytics.
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 