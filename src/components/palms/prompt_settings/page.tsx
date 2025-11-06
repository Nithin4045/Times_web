'use client';

import { Modal, Button, Input, Tooltip } from 'antd';
import styles from './page.module.css';

export type MetaPair = { keyLabel: string; prompt: string };

type Props = {
  open: boolean;
  onClose: () => void;
  items: MetaPair[];
  onChangeItem: (index: number, field: 'keyLabel' | 'prompt', value: string) => void;
  onSave: () => void;

  // NEW (optional):
  allowAddRemove?: boolean;             // hide add/remove when false
  readOnlyKey?: boolean;                // lock key input when true

  // Optional when allowAddRemove=false
  onAdd?: () => void;
  onRemove?: (index: number) => void;
};

export default function PromptSettingsPopup({
  open,
  onClose,
  items,
  onChangeItem,
  onAdd,
  onRemove,
  onSave,
  allowAddRemove = true,
  readOnlyKey = false,
}: Props) {
  const last = items?.[items.length - 1];
  const canAdd =
    allowAddRemove &&
    (!!onAdd) &&
    (!!last ? !!last.keyLabel?.trim()?.length && !!last.prompt?.trim()?.length : true);

  return (
    <Modal
      title="Prompt Settings"
      open={open}
      onCancel={onClose}
      width={860}
      className={styles.detailsModal}
      footer={
        <div className={styles.footerBar}>
          <div className={styles.footerLeft}>
            {allowAddRemove && (
              <Button onClick={onAdd} disabled={!canAdd}>
                + Add Field
              </Button>
            )}
          </div>
          <div className={styles.footerRight}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      }
    >
      {!items || items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🗒️</div>
          <div className={styles.emptyStateTitle}>No fields yet</div>
          <div className={styles.emptyStateDescription}>
            {allowAddRemove ? (
              <>
                Click <strong>+ Add Field</strong> to create your first entry.
              </>
            ) : (
              <>No editable fields are available.</>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.editorList}>
          {items.map((row, idx) => (
            <div key={idx} className={styles.pairRow}>
              <div className={styles.pairInputs}>
                {readOnlyKey ? (
                  <Tooltip title="Key is locked">
                    <Input
                      value={row.keyLabel}
                      disabled
                      placeholder="Key"
                      className={styles.pairName}
                    />
                  </Tooltip>
                ) : (
                  <Input
                    value={row.keyLabel}
                    onChange={(e) => onChangeItem(idx, 'keyLabel', e.target.value)}
                    placeholder="Key (e.g., Change Values)"
                    className={styles.pairName}
                  />
                )}

                <Input.TextArea
                  value={row.prompt}
                  onChange={(e) => onChangeItem(idx, 'prompt', e.target.value)}
                  placeholder="Prompt (paste/write your full prompt here)"
                  className={styles.pairContext}
                  autoSize={{ minRows: 3, maxRows: 12 }}
                />
              </div>

              {allowAddRemove ? (
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.removeButton}`}
                    title="Remove"
                    onClick={() => onRemove && onRemove(idx)}
                    disabled={items.length <= 1 || !onRemove}
                  >
                    ✖
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
