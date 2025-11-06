'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import styles from './page.module.css';

Chart.register(...registerables);

const WeekPerformancePage = () => {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  
  // Store chart instances for cleanup
  const barChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Destroy existing charts before creating new ones
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
      pieChartInstance.current = null;
    }
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }

    // Bar Chart - Weekly Score Comparison
    if (barChartRef.current) {
      const barCtx = barChartRef.current.getContext('2d');
      if (barCtx) {
        barChartInstance.current = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
            datasets: [{
              label: 'Score (%)',
              data: [95, 94, 93, 88, 86, 86, 85, 82, 81, 79, 79],
              backgroundColor: [
                '#5dbbdb',
                '#5b8fe8',
                '#5b6fe8',
                '#7b6be8',
                '#9b6be8',
                '#c96be8',
                '#e86bc9',
                '#e86b9b',
                '#e86b7b',
                '#e8806b',
                '#e8a06b'
              ],
              borderWidth: 0,
              barThickness: 40
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 75,
                max: 100,
                ticks: {
                  stepSize: 5,
                  callback: function(value) {
                    return value;
                  },
                  font: {
                    size: 12
                  }
                },
                grid: {
                  color: '#f0f0f0'
                },
                title: {
                  display: true,
                  text: 'Score (%)',
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 12
                  }
                },
                title: {
                  display: true,
                  text: 'Tests',
                  font: {
                    size: 12
                  }
                }
              }
            }
          }
        });
      }
    }

    // Pie Chart - Weekly Subject wise performance
    if (pieChartRef.current) {
      const pieCtx = pieChartRef.current.getContext('2d');
      if (pieCtx) {
        pieChartInstance.current = new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ['Subject one', 'Subject two', 'Subject three', 'Subject four'],
            datasets: [{
              data: [45, 25, 15, 10],
              backgroundColor: [
                '#5dbbdb',
                '#5b8fe8',
                '#7b6be8',
                '#c96be8'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  font: {
                    size: 13
                  },
                  padding: 15,
                  usePointStyle: false,
                  boxWidth: 15
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + '%';
                  }
                }
              }
            }
          },
          plugins: [{
            id: 'pieChartLabels',
            afterDatasetsDraw: function(chart) {
              const ctx = chart.ctx;
              chart.data.datasets.forEach(function(dataset, i) {
                const meta = chart.getDatasetMeta(i);
                meta.data.forEach(function(element, index) {
                  ctx.fillStyle = 'white';
                  const fontSize = 14;
                  const fontStyle = 'bold';
                  const fontFamily = 'Arial';
                  ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;

                  const dataString = dataset.data[index] + '%';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';

                  const position = element.tooltipPosition(false);
                  if (position && position.x !== null && position.y !== null) {
                    ctx.fillText(dataString, position.x, position.y);
                  }
                });
              });
            }
          }]
        });
      }
    }

    // Line Chart - Trend Analysis
    if (lineChartRef.current) {
      const lineCtx = lineChartRef.current.getContext('2d');
      if (lineCtx) {
        lineChartInstance.current = new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: ['Mock 1', 'Mock 2', 'Mock 3', 'Mock 4', 'Mock 5', 'Mock 6'],
            datasets: [
              {
                label: 'Score (%)',
                data: [76, 78, 80, 82, 85, 87],
                borderColor: '#5b6fe8',
                backgroundColor: '#5b6fe8',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#5b6fe8',
                tension: 0
              },
              {
                label: 'Rank (Lower is Better)',
                data: [200, 180, 160, 140, 120, 100],
                borderColor: '#e8406b',
                backgroundColor: '#e8406b',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#e8406b',
                borderDash: [5, 5],
                tension: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                  font: {
                    size: 12
                  },
                  padding: 15,
                  usePointStyle: true
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 80,
                max: 200,
                ticks: {
                  stepSize: 20,
                  font: {
                    size: 12
                  }
                },
                grid: {
                  color: '#f0f0f0'
                },
                title: {
                  display: true,
                  text: 'Performance',
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                grid: {
                  display: true,
                  color: '#f0f0f0'
                },
                ticks: {
                  font: {
                    size: 12
                  }
                },
                title: {
                  display: true,
                  text: 'Mock Tests',
                  font: {
                    size: 12
                  }
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function to destroy charts when component unmounts
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
        pieChartInstance.current = null;
      }
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
            <span className={styles.headerTitleSpan}>Leaderboard -</span> Weekly Graphical Insights
          </h1>
          <div className={styles.headerControls}>
            <select className={styles.dropdown}>
              <option>Display 4 Weeks</option>
            </select>
            <button className={styles.backButton}>← Back</button>
          </div>
        </div>

        <div className={styles.chartsRow}>
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Weekly Score Comparison</div>
            <div className={styles.chartWrapper}>
              <canvas ref={barChartRef} className={styles.chartCanvas}></canvas>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Weekly Subject wise performance</div>
            <div className={styles.chartWrapper}>
              <canvas ref={pieChartRef} className={styles.chartCanvas}></canvas>
            </div>
          </div>
        </div>

        <div className={styles.trendSection}>
          <div className={styles.chartTitle}>Trend Analysis: Score Progression</div>
          <div className={styles.trendChartWrapper}>
            <canvas ref={lineChartRef} className={styles.chartCanvas}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekPerformancePage;
