'use client';

import { Modal, Input, Select, Button } from 'antd';
import styles from './page.module.css';

const { TextArea } = Input;
const { Option } = Select;

export type EditableFieldsModal = {
  question?: string;
  options?: string;       // comma-separated or JSON array string
  correct_ans?: string;   // must match one of the options
};

export default function EditQuestionModal({
  open,
  title,
  data,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  open: boolean;
  title: string;
  data: EditableFieldsModal;
  onChange: (field: keyof EditableFieldsModal, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const getOptionList = (): string[] => {
    const raw = data.options ?? '';
    if (!raw.trim()) return [''];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall back to comma split
    }
    return raw.split(',').map(s => s.trim());
  };

  const updateOptionsAt = (index: number, value: string) => {
    const arr = [...getOptionList()];
    arr[index] = value;
    onChange('options', arr.join(', '));
  };

  const removeOptionAt = (index: number) => {
    const arr = [...getOptionList()];
    arr.splice(index, 1);
    onChange('options', arr.join(', '));
  };

  const addOption = () => {
    const arr = [...getOptionList(), ''];
    onChange('options', arr.join(', '));
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={800}
      className={styles.editModal}
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={onSave} loading={!!saving}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className={styles.modalContent}>
        {/* Question */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Question:</label>
          <TextArea
            rows={3}
            value={data.question}
            onChange={e => onChange('question', e.target.value)}
            placeholder="Enter question text"
            className={styles.formTextArea}
          />
        </div>

        {/* Options */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Options:</label>
          <div className={styles.optionsEditor}>
            {getOptionList().map((opt, index) => (
              <div key={index} className={styles.optionEditor}>
                <span className={styles.optionLabel}>
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  value={opt}
                  onChange={e => updateOptionsAt(index, e.target.value)}
                  className={styles.optionInput}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                <button
                  className={styles.removeOptionButton}
                  onClick={() => removeOptionAt(index)}
                >
                  ✖
                </button>
              </div>
            ))}

            <button onClick={addOption} className={styles.addOptionButton}>
              ➕ Add Option
            </button>
          </div>
        </div>

        {/* Correct Answer */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Correct Answer:</label>
          <Select
            value={data.correct_ans}
            onChange={value => onChange('correct_ans', value)}
            placeholder="Select Correct Option"
            className={styles.formSelect}
          >
            {getOptionList().map((opt, index) => (
              <Option key={index} value={opt}>
                {String.fromCharCode(65 + index)}. {opt}
              </Option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
