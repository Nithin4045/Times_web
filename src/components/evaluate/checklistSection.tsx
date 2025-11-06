import React from 'react';
import { Table, Slider } from 'antd';
// import styles from './checklist.module.css';
import styles from '@/assets/styles/evaluate/checklist.module.css'

interface Question {
  id: string;
  question: string;
  scale: Array<{ value: number; label: string }>;
  scaleMin: number;
  scaleMax: number;
}

interface ChecklistSectionProps {
  section: string;
  questions: Question[];
  selectedValues: { [key: string]: number | typeof NaN };
  onSliderChange: (id: string, value: number | null) => void;
  editable: boolean;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  section,
  questions,
  selectedValues,
  onSliderChange,
  editable,
}) => {
  return (
    <div className={styles['question-section']}>
      <h2 className={styles['section-heading']}>{`PRAGMATIQ PERSONALITY INVENTORY - ${section}`}</h2>
      <Table
        size="small"
        dataSource={questions}
        pagination={false}
        rowClassName={styles['question-row']}
        rowKey="id"
        showHeader={false}
        className={styles.checklisttable}
      >
        <Table.Column
          dataIndex="question"
          key="question"
          render={(text) => <div className={styles['question-text']}>{text}</div>}
          className={styles.checklisttable}
        />
        <Table.Column
          render={(text, qn) => (
            <div className={styles['slider-container']}>
              <Slider
                id={`Sl_${qn.id}`}
                marks={qn.scale.reduce((acc: any, mark: any) => {
                  acc[mark.value] = mark.label;
                  return acc;
                }, {})}
                min={qn.scaleMin}
                max={qn.scaleMax}
                step={null}
                style={{ width: '350px' }}
                trackStyle={{ backgroundColor: 'blue' }}
                handleStyle={{ borderColor: 'blue', backgroundColor: 'blue' }}
                railStyle={{ backgroundColor: 'lightblue' }}
                value={selectedValues[qn.id]}
                onChange={(value) => onSliderChange(qn.id, value)}
                disabled={!editable} // Makes the slider editable or not based on prop
              />
            </div>
          )}
          className={styles.checklisttable}
        />
      </Table>
    </div>
  );
};

export default ChecklistSection;
