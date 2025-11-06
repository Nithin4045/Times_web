"use client";

import React, { useState } from "react";
import { PDFAIQuestion } from "../../models/types";
import { Button, Switch, Modal } from "antd";
import { CheckOutlined, CloseOutlined, TagOutlined } from "@ant-design/icons";
import LaTeXRenderer from "@/components/LaTeXRenderer/LaTeXRenderer";
import styles from "./TaggedQuestions.module.css";

type Props = {
  questions: PDFAIQuestion[];
  onToggleApprove: (questionId: string, approved: boolean) => void;
  searchQuery: string;
};

export default function TaggedQuestions({ questions, onToggleApprove, searchQuery }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [qApprove, setQApprove] = useState<Record<string, boolean>>({});

  // Filter questions based on search query
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.question.toLowerCase().includes(query) ||
      q.area?.toLowerCase().includes(query) ||
      q.sub_area?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query) ||
      q.sub_topic?.toLowerCase().includes(query) ||
      false
    );
  });

  const toggleOpen = (id: string) => {
    const newOpenIds = new Set(openIds);
    if (newOpenIds.has(id)) {
      newOpenIds.delete(id);
    } else {
      newOpenIds.add(id);
    }
    setOpenIds(newOpenIds);
  };

  const handleApproveMain = (id: string, approved: boolean) => {
    setQApprove((prev) => ({ ...prev, [id]: approved }));
    onToggleApprove(id, approved);
  };

  const coerceApproved = (q: PDFAIQuestion) => {
    return Boolean(q.approved);
  };

  if (filteredQuestions.length === 0) {
    return (
      <div className={styles.emptyState}>
        {searchQuery ? `No tagged questions found for "${searchQuery}"` : "No tagged questions available."}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {filteredQuestions.map((q) => {
        const open = openIds.has(q.id);
        const hasTags = q.area || q.sub_area || q.topic || q.sub_topic;

        return (
          <div key={q.id} className={styles.questionCard}>
            {/* Header */}
            <div className={styles.questionHeader}>
              <div className={styles.questionInfo}>
                <div className={styles.questionNumber}>
                  Q{q.question_number || q.id}
                </div>
                <div className={styles.approvalStatus}>
                  <Switch
                    checked={qApprove[q.id] ?? coerceApproved(q)}
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                    onChange={(approved) => handleApproveMain(q.id, approved)}
                  />
                </div>
              </div>
            </div>

            {/* Question */}
            <LaTeXRenderer 
              content={q.question || ''}
              className={styles.questionText}
            />

            {/* Options */}
            {q.options && q.options.length > 0 && (
              <ul className={styles.optionsList}>
                {q.options.slice(0, 4).map((opt, i) => (
                  <li key={i} className={styles.optionItem}>
                    <span className={styles.optionIndex}>{String.fromCharCode(65 + i)}.</span>
                    <LaTeXRenderer 
                      content={opt || ''}
                      className={styles.optionText}
                      inline
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* Tags */}
            <div className={styles.tagsContainer}>
              <div className={styles.tagsHeader}>
                <TagOutlined className={styles.tagIcon} />
                <span className={styles.tagsTitle}>Tagging</span>
              </div>
              <div className={styles.tagsGrid}>
                <div className={styles.tagItem}>
                  <span className={styles.tagLabel}>Area</span>
                  <span className={styles.tagValue}>{q.area ?? "—"}</span>
                </div>
                <div className={styles.tagItem}>
                  <span className={styles.tagLabel}>Sub Area</span>
                  <span className={styles.tagValue}>{q.sub_area ?? "—"}</span>
                </div>
                <div className={styles.tagItem}>
                  <span className={styles.tagLabel}>Topic</span>
                  <span className={styles.tagValue}>{q.topic ?? "—"}</span>
                </div>
                <div className={styles.tagItem}>
                  <span className={styles.tagLabel}>Sub Topic</span>
                  <span className={styles.tagValue}>{q.sub_topic ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(q.direction || q.passage || q.notes) && (
              <div className={styles.additionalInfo}>
                {q.direction && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Direction:</span>
                    <span className={styles.infoValue}>{q.direction}</span>
                  </div>
                )}
                {q.passage && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Passage:</span>
                    <span className={styles.infoValue}>{q.passage}</span>
                  </div>
                )}
                {q.notes && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Notes:</span>
                    <span className={styles.infoValue}>{q.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
