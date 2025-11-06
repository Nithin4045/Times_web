"use client";

import React from "react";
import Link from "next/link";
import { Button, Typography, Row, Col } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const NotFound = () => {
  return (
    <Row
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
      }}
    >
      <Col
        span={12}
        style={{
          textAlign: "center",
          padding: "50px",
          background: "#ffffff",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Title level={2} style={{ color: "#1890ff" }}>
          Lost in Code!
        </Title>
        <Text style={{ fontSize: "16px", color: "#595959" }}>
        Currently, You do not have access to this module
        </Text>
        <div style={{ marginTop: "30px" }}>
          <Link href="/dashboard">
            <Button  type="primary" icon={<HomeOutlined />} size="large" style={{backgroundColor:'#244081',color:'white'}}>
              Go back to Home
            </Button>
          </Link>
        </div>
      </Col>
    </Row>
  );
};

export default NotFound;
