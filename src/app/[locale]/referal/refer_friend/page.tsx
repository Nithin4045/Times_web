'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const ReferFriendPage = () => {
  const router = useRouter();

  return (
    <div className={styles.pageContainer}>
      {/* Top Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <span className={styles.activeTab}>Leaderboard</span>
          <div className={styles.separator}></div>
          <span className={styles.inactiveTab}>Refer a Friend</span>
        </div>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <hr className={styles.hrRule} />

      <div className={styles.contentWrapper}>
        <div className={styles.mainCard}>
          <div className={styles.contentGrid}>
            {/* Left Panel - Text Content and Statistics */}
            <div className={styles.leftPanel}>
              {/* Main Heading */}
              <div className={styles.headingSection}>
                <h1 className={styles.mainHeading}>Refer Friends, Earn Rewards</h1>
                <p className={styles.subHeading}>Give 15%, Get 10% - Everyone Wins!</p>
              </div>

              {/* Share Button */}
              <div className={styles.shareButtonContainer}>
                <button 
                  className={styles.shareButton}
                  onClick={() => router.push('/referal')}
                >
                  <span>Share your link</span>
                  <svg className={styles.shareIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Instructions */}
              <div className={styles.instructionsSection}>
                <div className={styles.instructionText}>Send your unique code via WhatsApp/email</div>
                <div className={styles.instructionText}>Friend buys with 15% OFF, You get 10% cashback instantly</div>
              </div>

              {/* Statistics Cards */}
              <div className={styles.statsGrid}>
                {/* Successful Referrals Card */}
                <div className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div className={styles.statNumber}>3</div>
                    <div className={styles.statLabel}>Successful Referrals</div>
                    <div className={styles.statDescription}>3 friends joined using your code</div>
                  </div>
                </div>

                {/* Earned Rewards Card */}
                <div className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div className={styles.statNumber}>₹750</div>
                    <div className={styles.statLabel}>Earned Rewards</div>
                    <div className={styles.statDescription}>Cashback pending in your wallet</div>
                  </div>
                </div>
              </div>

              {/* Friend Progress */}
              <div className={styles.progressCard}>
                <div className={styles.progressLabel}>2/3 Friend Progress</div>
                <div className={styles.progressDescription}>2/3 referred students are active</div>
              </div>
            </div>

            {/* Right Panel - Phone Illustrations */}
            <div className={styles.rightPanel}>
              <div className={styles.phoneContainer}>
                {/* Left Phone */}
                <div className={styles.phoneLeft}>
                  <div className={styles.phoneContent}>
                    {/* Status indicator */}
                    <div className={styles.statusIndicator}></div>
                    
                    {/* Character */}
                    <div className={styles.characterContainer}>
                      <div className={styles.characterOuter}>
                        <div className={styles.characterMiddle}>
                          <div className={styles.characterInner}></div>
                        </div>
                      </div>
                      <div className={styles.characterIcon}>
                        <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Speech bubble */}
                    <div className={styles.speechBubble}>
                      <svg className={styles.speechIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right Phone */}
                <div className={styles.phoneRight}>
                  <div className={styles.phoneContent}>
                    {/* Status indicator */}
                    <div className={styles.statusIndicator}></div>
                    
                    {/* Character */}
                    <div className={styles.characterContainer}>
                      <div className={styles.characterOuter}>
                        <div className={styles.characterMiddle}>
                          <div className={styles.characterInner}></div>
                        </div>
                      </div>
                      <div className={styles.characterIcon}>
                        <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Speech bubble */}
                    <div className={styles.speechBubble}>
                      <svg className={styles.speechIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.904a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferFriendPage;
