import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, locale = 'en' } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.toLowerCase().trim();

    // ALL YOUR PATHS
    const workingPages = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Go to your main dashboard',
        path: `/dashboard/student`,
        type: 'dashboard',
        section: 'Home'
      },
      {
        id: 'profile',
        title: 'My Profile',
        description: 'View and edit your profile',
        path: `/profile`,
        type: 'profile',
        section: 'Account'
      },
      {
        id: 'leaderboard',
        title: 'Leaderboard',
        description: 'View rankings and leaderboard',
        path: `/progress_zone/leaderboard`,
        type: 'progress',
        section: 'Competition'
      },
      {
        id: 'weekly-performance',
        title: 'Weekly Performance',
        description: 'Check your weekly performance',
        path: `/progress_zone/weekly_performance`,
        type: 'progress',
        section: 'Analytics'
      },
      {
        id: 'magazines',
        title: 'Study Magazines',
        description: 'Read study magazines and materials',
        path: `/study_practice/magazines`,
        type: 'study',
        section: 'Materials'
      },
      {
        id: 'test-details',
        title: 'Test Details',
        description: 'View test details and evaluations',
        path: `/evaluate/testdetails`,
        type: 'evaluate',
        section: 'Tests'
      },
      {
        id: 'question-of-day',
        title: 'Question of the Day',
        description: 'Daily challenge questions',
        path: `/challenge_zone/question_of_the_day`,
        type: 'challenge',
        section: 'Daily Challenge'
      },
      {
        id: 'refer-friend',
        title: 'Refer a Friend',
        description: 'Invite friends and earn rewards',
        path: `/referal/refer_friend`,
        type: 'referral',
        section: 'Refer & Earn'
      },
      {
        id: 'coupon-code',
        title: 'Coupon Codes',
        description: 'Use coupon codes for discounts',
        path: `/referal/coupoun_code`,
        type: 'referral',
        section: 'Refer & Earn'
      }
    ];

    // Filter results
    const filteredResults = workingPages.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.section.toLowerCase().includes(searchTerm) ||
      item.type.toLowerCase().includes(searchTerm)
    );

    // Always return at least some pages
    const finalResults = filteredResults.length > 0 ? filteredResults : workingPages.slice(0, 4);

    return NextResponse.json({ results: finalResults });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] });
  }
}