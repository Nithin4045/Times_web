'use client';

import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import ResultsPage from '@/components/evaluate/resultsPage';
import useTestStore from '@/store/evaluate/teststore';

const ResultsPageWrapper = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const { testId, userTestId } = useTestStore();

  console.log('user data', testId , userTestId);
  console.log("Test ID:", testId); // Debugging
  console.log("User Test ID:", userTestId);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/evaluate/results?testId=${testId}&userTestId=${userTestId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const { summary, details } = await response.json();
        setData(details);
        setTotalScore(summary.totalScoredMarks);  // Correcting the key here to match API response
      } catch (error) {
        console.error(error);
        message.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId, userTestId]);

  // Adjusted column configuration to match the returned API data structure
  const columnsConfig = [
    { key: 'subject', title: 'Subject', dataIndex: 'subject', visible: true },
    { key: 'totalQuestions', title: 'Total Questions', dataIndex: 'totalQuestions', visible: true },
    { key: 'answered', title: 'Answered', dataIndex: 'answered', visible: true },
    { key: 'unanswered', title: 'Unanswered', dataIndex: 'unanswered', visible: true },
    { key: 'scoredMarks', title: 'Scored Marks', dataIndex: 'scoredMarks', visible: true }, // Corrected key name
    { key: 'totalScore', title: 'Total Score', dataIndex: 'totalScore', visible: true }, // No change needed
  ];

  return (
    
    <Spin spinning={loading}>
      <ResultsPage
        data={data}
        columnsConfig={columnsConfig}
        showTotalScore={true}
        totalScore={totalScore}
      />
    </Spin>
  );
};

export default ResultsPageWrapper;
