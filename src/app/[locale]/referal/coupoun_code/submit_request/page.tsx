'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { SetBreadcrumb } from '../../BreadcrumbContext';

const SubmitRequestPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    courseCategory: '',
    courseVariant: '',
    courseName: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    // You can add API call or navigation logic here
  };

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb */}
      <SetBreadcrumb text="Submit request" />

      <div className={styles.contentWrapper}>
        <div className={styles.mainCard}>
          {/* Course Information */}
          <div className={styles.courseInfo}>
            <div className={styles.courseText}>
              Course Name: CAT 2025 Online Flexi Course, ID: TME-CAT25-XXXX, Status: <span className={styles.activeStatus}>Active</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className={styles.warningCard}>
            <div className={styles.warningText}>
              Customized Coupon Code request not allowed until the current one is used. Other coupons can still be applied.
            </div>
          </div>

          {/* Coupon Code Request Form */}
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>Coupon code request</h2>
            
            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Dropdown Fields */}
              <div className={styles.dropdownGrid}>
                {/* Course Category */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Course Category</label>
                  <div className={styles.selectContainer}>
                    <select
                      name="courseCategory"
                      value={formData.courseCategory}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">Select Category</option>
                      <option value="engineering">Engineering</option>
                      <option value="medical">Medical</option>
                      <option value="management">Management</option>
                    </select>
                    <div className={styles.selectIcon}>
                      <svg className={styles.iconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Course Variant */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Course Variant</label>
                  <div className={styles.selectContainer}>
                    <select
                      name="courseVariant"
                      value={formData.courseVariant}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">Select Variant</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <div className={styles.selectIcon}>
                      <svg className={styles.iconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Course Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Course Name</label>
                  <div className={styles.selectContainer}>
                    <select
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">Select Course</option>
                      <option value="cat2025">CAT 2025</option>
                      <option value="gate2025">GATE 2025</option>
                      <option value="jee2025">JEE 2025</option>
                    </select>
                    <div className={styles.selectIcon}>
                      <svg className={styles.iconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Field */}
              <div className={styles.textareaGroup}>
                <label className={styles.label}>Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className={styles.textarea}
                  placeholder="Enter your message here..."
                />
              </div>

              {/* Submit Button */}
              <div className={styles.submitContainer}>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitRequestPage;
