"use client";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

interface ReferredData {
  name: string;
  contact: string;
  email: string;
  referredCourse: string;
  status: string;
}

interface ReferralHistoryItem extends ReferredData {
  id: string;
  date: string;
}

interface Course {
  id: number;
  coursename: string;
  course_category?: number;
  price?: number;
  active: boolean;
  type: string;
}

const ReferEarnPage: React.FC = () => {
  const [referred, setReferred] = useState<ReferredData>({
    name: "",
    contact: "",
    email: "",
    referredCourse: "",
    status: "Referred",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [historyData, setHistoryData] = useState<ReferralHistoryItem[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<ReferralHistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);

  useEffect(() => {
    fetchHistory();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch("/api/referal", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (data.success) {
        setCourses(data.data || []);
      } else {
        console.error("API Error:", data);
        showToast("error", data.message || "Failed to load courses.");
        setCourses([]);
      }
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      showToast("error", err.message || "Failed to load courses.");
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleReferredChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setReferred({
      ...referred,
      [e.target.name]: e.target.value,
    });
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/refer-earn", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (response.ok) {
        let referrals = [];

        if (Array.isArray(data)) {
          referrals = data;
        } else if (data.referrals && Array.isArray(data.referrals)) {
          referrals = data.referrals;
        } else if (data.data && Array.isArray(data.data)) {
          referrals = data.data;
        } else {
          console.log("Unexpected data structure:", data);
          setHistoryData([]);
          setIsLoadingHistory(false);
          return;
        }

        const transformedData = referrals.map((item: any, index: number) => ({
          id: item.id || item._id || `ref-${index}`,
          name: item.name || "Unknown",
          contact: item.contact || "N/A",
          email: item.email || "N/A",
          referredCourse: item.referredCourse || "N/A",
          status: item.status || "Referred",
          date: item.date || item.createdAt || new Date().toISOString(),
        }));
        setHistoryData(transformedData);
      } else {
        showToast("error", data.message || "Failed to load history.");
        setHistoryData([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      showToast("error", "Failed to load referral history.");
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReferralClick = (referral: ReferralHistoryItem) => {
    setSelectedReferral(referral);
  };

  const closeModal = () => {
    setSelectedReferral(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = "/api/refer-earn";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(referred),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", data.message || "Referral submitted!");
        setReferred({ name: "", contact: "", email: "", referredCourse: "", status: "Referred" });
        fetchHistory();
      } else {
        showToast("error", data.error || "Failed to submit referral.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network or server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.titleH2}>
        <h2>Refer & Earn</h2>
      </div>
    <div className={styles.referEarnWrapper}>
      {/* Left Side - Refer & Earn Form */}
      <div className={styles.referSection}>
        <p style={{paddingLeft:'10px'}}>Enter the details</p>
        <form onSubmit={handleSubmit} className={styles.referForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={referred.name}
              onChange={handleReferredChange}
              placeholder="Enter full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact">Contact Number *</label>
            <input
              type="tel"
              id="contact"
              name="contact"
              value={referred.contact}
              onChange={handleReferredChange}
              placeholder="Enter contact number"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={referred.email}
              onChange={handleReferredChange}
              placeholder="Enter email address"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="referredCourse">Referred Course *</label>
            <select
              id="referredCourse"
              name="referredCourse"
              value={referred.referredCourse}
              onChange={handleReferredChange}
              required
              disabled={isSubmitting || isLoadingCourses}
            >
              <option value="">
                {isLoadingCourses ? "Loading courses..." : "Select a course"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.coursename}>
                  {course.coursename}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            {isSubmitting ? "Submitting..." : "Submit Referral"}
          </button>
        </form>
      </div>

      {/* Right Side - History */}
      <div className={styles.historySection}>
       <p style={{paddingLeft:'10px'}}>History</p> 
        <div className={styles.historyContent}>
          {isLoadingHistory ? (
            <div className={styles.loading}>Loading...</div>
          ) : historyData.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <p>No referrals yet</p>
            </div>
          ) : (
            <div className={styles.referralList}>
              {historyData.map((referral) => (
                <div
                  key={referral.id}
                  className={styles.referralItem}
                  onClick={() => handleReferralClick(referral)}
                >
                  <div className={styles.referralInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className={styles.referralName}>{referral.name}</div>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#3b82f6',
                        color: 'white'
                      }}>
                        {referral.status}
                      </span>
                    </div>
                    <div className={styles.referralCourse}>{referral.referredCourse}</div>
                  </div>
                  <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {selectedReferral && (
        <>
          {/* Overlay */}
          <div className={styles.modalOverlay} onClick={closeModal}></div>

          {/* Modal Content */}
          <div className={styles.modalPopup}>
            <div className={styles.modalHeader}>
              <h3>Referral Details</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Name:</span>
                <span className={styles.modalValue}>{selectedReferral.name}</span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Contact:</span>
                <span className={styles.modalValue}>{selectedReferral.contact}</span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Email:</span>
                <span className={styles.modalValue}>{selectedReferral.email}</span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Course:</span>
                <span className={styles.modalValue}>{selectedReferral.referredCourse}</span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Status:</span>
                <span className={styles.modalValue}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {selectedReferral.status}
                  </span>
                </span>
              </div>

              <div className={styles.modalDetailItem}>
                <span className={styles.modalLabel}>Date:</span>
                <span className={styles.modalValue}>{new Date(selectedReferral.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  </div>
  );
};

export default ReferEarnPage;