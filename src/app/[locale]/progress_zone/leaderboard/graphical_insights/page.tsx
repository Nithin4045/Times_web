'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarController, DoughnutController, LineController } from 'chart.js';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarController, DoughnutController, LineController);

export default function GraphicalInsightsPage() {
  const params = useParams();
  const locale = params.locale;
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let barChart: Chart | null = null;
    let pieChart: Chart | null = null;
    let lineChart: Chart | null = null;

    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        barChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
            datasets: [{
              label: 'Score (%)',
              data: [95, 94, 93, 88, 86, 86, 85, 82, 81, 79, 79],
              backgroundColor: [
                '#60A5FA',
                '#818CF8',
                '#8B5CF6',
                '#A78BFA',
                '#C084FC',
                '#E879F9',
                '#F472B6',
                '#FB7185',
                '#F87171',
                '#FB923C',
                '#FBBF24'
              ],
              borderRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 75,
                max: 100,
                ticks: { font: { family: 'Rubik' } }
              },
              x: {
                title: { display: true, text: 'Tests', font: { family: 'Rubik', size: 14 } },
                ticks: { font: { family: 'Rubik' } }
              }
            }
          }
        });
      }
    }

    if (pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d');
      if (ctx) {
        pieChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Subject one', 'Subject two', 'Subject three', 'Subject four'],
            datasets: [{
              data: [45, 25, 15, 10],
              backgroundColor: ['#60A5FA', '#8B5CF6', '#A78BFA', '#C084FC'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'right',
                labels: { font: { family: 'Rubik', size: 13 }, padding: 15 }
              }
            }
          }
        });
      }
    }

    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      if (ctx) {
        lineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mock 1', 'Mock 2', 'Mock 3', 'Mock 4', 'Mock 5', 'Mock 6'],
            datasets: [
              {
                label: 'Score (%)',
                data: [75, 78, 80, 82, 85, 88],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#3B82F6'
              },
              {
                label: 'Rank (Lower is Better)',
                data: [200, 182, 160, 140, 120, 100],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderDash: [5, 5],
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#EF4444'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: { font: { family: 'Rubik', size: 13 }, padding: 15 }
              }
            },
            scales: {
              y: {
                title: { display: true, text: 'Performance', font: { family: 'Rubik', size: 14 } },
                ticks: { font: { family: 'Rubik' } }
              },
              x: {
                title: { display: true, text: 'Mock Tests', font: { family: 'Rubik', size: 14 } },
                ticks: { font: { family: 'Rubik' } }
              }
            }
          }
        });
      }
    }

    return () => {
      if (barChart) barChart.destroy();
      if (pieChart) pieChart.destroy();
      if (lineChart) lineChart.destroy();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>Leaderboard</span>
            <span> - Graphical Insights</span>
          </h1>
          <Link href={`/${locale}/progress_zone/leaderboard`} className={styles.backButton}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </Link>
        </div>
        <hr className={styles.headerDivider} />
      </div>

      <div className={styles.chartsGrid}>
        {/* Score Comparison */}
        <div className={`${styles.chartCard} ${styles.fadeIn}`}>
          <h3 className={styles.chartTitle}>Score Comparison</h3>
          <div className={styles.chartWrapper}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>

        {/* Subject wise performance */}
        <div className={`${styles.chartCard} ${styles.fadeIn}`} style={{ animationDelay: '0.1s' }}>
          <h3 className={styles.chartTitle}>Subject wise performance</h3>
          <div className={styles.chartWrapper}>
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className={`${styles.chartCard} ${styles.fadeIn}`} style={{ animationDelay: '0.2s' }}>
        <h3 className={styles.chartTitleLarge}>Trend Analysis: Score Progression</h3>
        <div className={styles.chartWrapper}>
          <canvas ref={lineChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
