import React from 'react';
import { Table, Typography } from 'antd';
import styles from "@/app/[locale]/evaluate/checklist/checklist.module.css"
const { Title } = Typography;

interface ColumnConfig {
  key: string;
  title: string;
  dataIndex: string;
  visible: boolean; // Determines if the column is displayed
}

interface ResultsPageProps {
  data: Record<string, any>[]; // Array of objects representing table data
  columnsConfig: ColumnConfig[]; // Dynamic column configuration
  showTotalScore: boolean; // Whether to display total score
  totalScore?: number; // Total score to display if showTotalScore is true
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  data,
  columnsConfig,
  showTotalScore,
  totalScore,
}) => {
  // Filter columns based on the visibility flag
  const visibleColumns = columnsConfig.filter((col) => col.visible);

  return (
    <div style={{ padding: '20px' }}>
      
      <Table
        dataSource={data}
        columns={visibleColumns}
        pagination={false}
        bordered
        rowKey={(record) => record.key || record.subject}
        className={styles.checklisttable}
      />
      {showTotalScore && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Title level={5}>
            Your Total Score: <span style={{ color: 'purple' }}>{totalScore}</span>
          </Title>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
