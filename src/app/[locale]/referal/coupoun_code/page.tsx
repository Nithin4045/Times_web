'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { SetBreadcrumb } from '../BreadcrumbContext';

const CouponCodePage = () => {
  const router = useRouter();

  const handleCopyToClipboard = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode).then(() => {
      // You can add a toast notification here if needed
      console.log('Coupon copied to clipboard:', couponCode);
    });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb */}
      <SetBreadcrumb text="Exclusives | Coupon Codes" />

      <div className={styles.contentWrapper}>
        <div className={styles.mainCard}>
          {/* Course Information */}
          <div className={styles.courseInfo}>
            <div className={styles.courseText}>
              Course Name: CAT 2025 Online Flexi Course, ID: TME-CAT25-XXXX, Status: <span className={styles.activeStatus}>Active</span>
            </div>
          </div>

          {/* Available Coupon Codes Section */}
          <div className={styles.couponSection}>
            <h2 className={styles.sectionTitle}>Available Coupon Codes</h2>
            <p className={styles.sectionDescription}>Grab your coupon before the timer runs out!</p>
            
            {/* Coupon Cards */}
            <div className={styles.couponGrid}>
              {/* First Coupon Card - Beige/Orange Theme */}
              <div className={styles.couponCard}>
                <div className={styles.couponContent}>
                  <div className={styles.couponName}>Festive Offer</div>
                  <div className={styles.couponCodeContainer}>
                    <span className={styles.couponCode}>TIME-FEST-25</span>
                  </div>
                  <div 
                    className={styles.copyLink}
                    onClick={() => handleCopyToClipboard('TIME-FEST-25')}
                  >
                    Copy to clipboard
                  </div>
                  <div className={styles.discountBadge}>25%OFF</div>
                  <div className={styles.validityText}>Valid till - 31 Oct 2025</div>
                  <div className={styles.timerText}>3d : 12h : 45m</div>
                </div>
              </div>

              {/* Second Coupon Card - Light Green Theme */}
              <div className={styles.couponCard}>
                <div className={styles.couponContent}>
                  <div className={styles.couponName}>Festive Offer</div>
                  <div className={styles.couponCodeContainer}>
                    <span className={styles.couponCode}>UPGRADE10</span>
                  </div>
                  <div 
                    className={styles.copyLink}
                    onClick={() => handleCopyToClipboard('UPGRADE10')}
                  >
                    Copy to clipboard
                  </div>
                  <div className={styles.discountBadge}>10%OFF</div>
                  <div className={styles.validityText}>Valid till - 31 Oct 2025</div>
                  <div className={styles.timerText}>3d : 12h : 45m</div>
                </div>
              </div>

              {/* Third Card - White Theme */}
              <div className={styles.requestCard}>
                <div className={styles.requestContent}>
                  <div className={styles.requestTitle}>Don't see a coupon for your next course?</div>
                  <div className={styles.requestDescription}>Submit a request and our team will share a personalized offer.</div>
                  <div className={styles.requestStatus}>Previous request is in progress.</div>
                  <button 
                    className={styles.submitButton}
                    onClick={() => router.push('/referal/coupoun_code/submit_request')}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className={styles.termsCard}>
            <h3 className={styles.termsTitle}>Terms & Conditions</h3>
            <div className={styles.termsList}>
              <div className={styles.termsItem}>• Coupons are applicable only on selected courses.</div>
              <div className={styles.termsItem}>• Each coupon is valid for single use per student.</div>
              <div className={styles.termsItem}>• Expired coupons cannot be reactivated.</div>
              <div className={styles.termsItem}>• T.I.M.E. reserves the right to modify or withdraw offers anytime.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCodePage;
