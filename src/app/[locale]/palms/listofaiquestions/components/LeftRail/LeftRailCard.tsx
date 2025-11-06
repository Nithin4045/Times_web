"use client";

import React from "react";
import { FileTextOutlined } from "@ant-design/icons";
import styles from "./LeftRail.module.css";
import { formatDate } from "../../lib/format";
import type { LeftRailCardItem } from "./LeftRail";

type Props = {
  item: LeftRailCardItem;
};

const LeftRailCard: React.FC<Props> = ({ item }) => {
  const isProcessing = item.badge === "processing";
  const isClickable = Boolean(item.onClick);

  return (
    <div
      className={`${styles.fileCard} ${item.isActive ? styles.activeCard : ""} ${
        isProcessing ? styles.processingCard : ""
      }`}
      role="listitem"
      onClick={isClickable ? item.onClick : undefined}
      style={{ cursor: isClickable ? "pointer" : "default" }}
    >
      <div className={styles.fileTitle}>
        <FileTextOutlined className={styles.fileIcon} />
        <span className={styles.fileTitleText}>{item.label}</span>
      </div>

      <div className={styles.metaRow}>
        {item.typeLabel && (
          <span
            className={`${styles.typeBadge} ${
              item.badge === "processing"
                ? styles.badgeProcessing
                : item.badge === "error"
                ? styles.badgeError
                : styles.badgeDone
            }`}
          >
            {item.typeLabel}
          </span>
        )}
        <span className={styles.createdAt}>{formatDate(item.createdAt)}</span>
      </div>

      <div className={styles.countRow}>{item.detail}</div>

      {item.errorMsg && (
        <div className={styles.errorBox}>
          <span>{item.errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default LeftRailCard;
