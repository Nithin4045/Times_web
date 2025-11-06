"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, EyeOutlined, FunctionOutlined } from '@ant-design/icons';
import 'mathlive/dist/mathlive-fonts.css';
import 'mathlive/dist/mathlive-static.css';
import LaTeXRenderer from '../LaTeXRenderer/LaTeXRenderer';
import styles from './LaTeXEditor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  inline?: boolean;
  showMathToolbar?: boolean;
};

/**
 * LaTeXEditor - Rich text editor with LaTeX math support
 * Uses MathLive for math editing and KaTeX for rendering
 */
export default function LaTeXEditor({
  value,
  onChange,
  placeholder = 'Enter text with math expressions...',
  readOnly = false,
  inline = false,
  showMathToolbar = true,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const insertMath = async () => {
    if (!editorRef.current) return;

    try {
      const MathfieldElement = (await import('mathlive')).MathfieldElement;
      
      const mathfield = new MathfieldElement();

      mathfield.style.cssText = `
        display: inline-block;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        padding: 4px 8px;
        margin: 0 4px;
        background: #f5f5f5;
      `;

      mathfield.addEventListener('input', () => {
        const latex = mathfield.value;
        if (latex) {
          const newValue = localValue + ` $${latex}$ `;
          setLocalValue(newValue);
          mathfield.remove();
        }
      });

      mathfield.addEventListener('blur', () => {
        mathfield.remove();
      });

      editorRef.current.appendChild(mathfield);
      mathfield.focus();
      mathFieldRef.current = mathfield;
    } catch (error) {
      console.error('Error loading MathLive:', error);
    }
  };

  if (readOnly || !isEditing) {
    return (
      <div className={styles.container}>
        <div className={styles.displayContainer}>
          <LaTeXRenderer content={localValue || value} inline={inline} />
          {!readOnly && (
            <div className={styles.editButton}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={handleEdit}
                size="small"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.editorContainer}>
        {showMathToolbar && (
          <div className={styles.toolbar}>
            <Space>
              <Tooltip title="Insert Math Expression">
                <Button
                  icon={<FunctionOutlined />}
                  onClick={insertMath}
                  size="small"
                >
                  Math
                </Button>
              </Tooltip>
              <div className={styles.hint}>
                Use $...$ for inline math or $$...$$ for display math
              </div>
            </Space>
          </div>
        )}
        
        <div className={styles.editorWrapper}>
          <div
            ref={editorRef}
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const text = e.currentTarget.textContent || '';
              setLocalValue(text);
            }}
            onBlur={(e) => {
              const text = e.currentTarget.textContent || '';
              setLocalValue(text);
            }}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: localValue }}
          />
        </div>

        <div className={styles.preview}>
          <div className={styles.previewLabel}>
            <EyeOutlined /> Preview:
          </div>
          <div className={styles.previewContent}>
            <LaTeXRenderer content={localValue} inline={inline} />
          </div>
        </div>

        <div className={styles.actions}>
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSave}>
              Save
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
