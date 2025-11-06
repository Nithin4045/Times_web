"use client";

import React, { useMemo, useState } from "react";
import styles from "./LeftRail.module.css";
import dynamic from "next/dynamic";
import LeftRailCard from "./LeftRailCard";

const AntdSpin = dynamic(() => import("antd").then((m) => m.Spin), {
  ssr: false,
  loading: () => <div className={styles.spinnerLite} aria-busy="true" aria-label="Loading" />,
});

export type FileJob = {
  id: number;
  fileName: string;
  user_id: number;
  input_type: string;
  status: string | null;
  api_endpoint: string | null;
  response_time: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date | null;
  request_data?: string | null;
  response_data?: string | null;
};

export type LeftRailCardItem = {
  id: string;
  label: string;
  createdAt: string;
  badge: "processing" | "error" | "done";
  typeLabel: string | null;
  detail: string;
  errorMsg?: string | null;
  isActive?: boolean;
  onClick?: () => void;
};

type Props = {
  jobs: FileJob[];
  jobsLoading: boolean;
  jobsError: string | null;
  selectedJobId: number | null;
  onSelectJob: (job: FileJob) => void;
  search: string;
  onSearch: (value: string) => void;
};

const statusToBadge = (status?: string | null): LeftRailCardItem["badge"] => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "completed" || normalized === "success" || normalized === "finished") {
    return "done";
  }
  if (normalized === "failed" || normalized === "error") {
    return "error";
  }
  return "processing";
};

const formatTypeLabel = (value?: string | null): string | null => {
  if (!value) return null;
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getJobErrorText = (raw?: string | null): string | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error || parsed?.detail || JSON.stringify(parsed);
  } catch {
    return raw;
  }
};

export default function LeftRail({
  jobs,
  jobsLoading,
  jobsError,
  selectedJobId,
  onSelectJob,
  search,
  onSearch,
}: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Get unique job types
  const jobTypes = useMemo(() => {
    const types = new Set<string>();
    jobs.forEach(job => {
      if (job.input_type) {
        types.add(job.input_type);
      }
    });
    return Array.from(types).sort();
  }, [jobs]);

  const cardItems = useMemo<LeftRailCardItem[]>(() => {
    const query = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      // Filter by type
      if (selectedFilter !== "all" && job.input_type !== selectedFilter) {
        return false;
      }
      
      // Filter by search query
      if (!query) return true;
      const fileMatch = job.fileName?.toLowerCase().includes(query);
      const typeMatch = job.input_type?.toLowerCase().includes(query);
      return fileMatch || typeMatch;
    });

    return filtered.map((job) => {
      const badge = statusToBadge(job.status);
      const typeLabel = formatTypeLabel(job.input_type);
      
      const detail =
        badge === "done"
          ? "Tap to view results"
          : badge === "error"
          ? "Tap for error details"
          : "Processing...";

      let paperId = null;
      try {
        if (job.request_data) {
          const parsed = JSON.parse(job.request_data);
          paperId = parsed.paper_id || parsed.paperId || null;
        }
      } catch {
        // ignore parsing errors
      }

      return {
        id: `job-${job.id}`,
        label: job.fileName || `Job ${job.id}`,
        createdAt: new Date(job.createdAt as any).toISOString(),
        badge,
        typeLabel,
        detail,
        errorMsg: badge === "error" ? getJobErrorText(job.response_data) : null,
        isActive: selectedJobId === job.id,
        onClick: badge === "done" ? () => {
          console.log('========================================');
          console.log('🎴 LEFTRAIL CARD CLICKED');
          console.log('========================================');
          console.log('Job Info:', {
            jobId: job.id,
            fileName: job.fileName,
            inputType: job.input_type,
            status: job.status
          });
          console.log('Calling onSelectJob now...');
          onSelectJob(job);
        } : undefined,
      };
    });
  }, [jobs, onSelectJob, search, selectedJobId, selectedFilter]);

  return (
    <aside className={styles.leftRail}>
      <div className={styles.leftHeader}>
        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="Search jobs…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
          <select
            className={styles.filterSelect}
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            {jobTypes.map((type) => (
              <option key={type} value={type}>
                {formatTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.cardList} role="list">
        {jobsLoading && (
          <div className={styles.centerState}>
            <AntdSpin size="small" />
          </div>
        )}

        {!jobsLoading && jobsError && (
          <div className={styles.emptyState}>Failed to load jobs: {jobsError}</div>
        )}

        {!jobsLoading && !jobsError && cardItems.map((item) => <LeftRailCard key={item.id} item={item} />)}

        {!jobsLoading && !jobsError && cardItems.length === 0 && (
          <div className={styles.emptyState}>No jobs found.</div>
        )}
      </div>
    </aside>
  );
}
