'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import styles from './page.module.css';
import CourseCard from './coursecard/CourseCard';
import CourseOfferCard from '@/components/CourseOfferCard/page';
import FeaturedCourseGrid from '@/components/FeaturedCourseGrid';
import { useSelectedCourse } from '@/store/selectedcourse';
import type { CourseBundle, ApiResponse } from "./types";
import type { FeaturedCourse } from '@/components/FeaturedCourseGrid';

function apiPath(p: string): string {
  return p.startsWith('/') ? p : `/${p}`;
}

interface RecommendedCourse {
  course_id: number;
  original_id: number;
  original_name: string;
  coursename: string;
  course_category: number;
  variant_id: number;
  total_students: number;
  completed_students: number;
  price: number | null;
  offer_price: number | null;
  offer_percent: number | null;
  offer_start_time: string | null;
  offer_end_time: string | null;
  image: string | null; // ADD THIS LINE
}

function valueOrNA(v: any): string {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s.length ? s : 'N/A';
}

function fmtValidUntil(iso?: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  const day = d.getDate();
  const suf = (n: number) =>
    (n % 10 === 1 && n % 100 !== 11) ? 'st' :
      (n % 10 === 2 && n % 100 !== 12) ? 'nd' :
        (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${suf(day)} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Featured courses data
const featuredCourses: FeaturedCourse[] = [
  {
    id: '1',
    title: 'IIT-Foundation',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/bitsom-shp-15-10-2025',
    order: 1,
    backgroundColor: '#fef3c7',
    textColor: '#1e40af'
  },
  {
    id: '2',
    title: 'BANK EXAMS',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/flame-shp-06-10-2025',
    order: 2,
    backgroundColor: '#1e40af',
    textColor: '#fef3c7'
  },
  {
    id: '3',
    title: 'IIT-Foundation',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/gl-14-10-2025-shp',
    order: 3,
    backgroundColor: '#fef3c7',
    textColor: '#1e40af'
  },
  {
    id: '4',
    title: 'BANK EXAMS',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/ibs-01-10-2025',
    order: 4,
    backgroundColor: '#1e40af',
    textColor: '#fef3c7'
  },
  {
    id: '5',
    title: 'BANK EXAMS',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/ifmr-shp-18-10-2025',
    order: 5,
    backgroundColor: '#1e40af',
    textColor: '#fef3c7'
  },
  {
    id: '6',
    title: 'IIT-Foundation',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/imt-nagpur-shp-18-10-2025',
    order: 6,
    backgroundColor: '#fef3c7',
    textColor: '#1e40af'
  },
  {
    id: '7',
    title: 'BANK EXAMS',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/liba-01-10-2025',
    order: 7,
    backgroundColor: '#1e40af',
    textColor: '#fef3c7'
  },
  {
    id: '8',
    title: 'IIT-Foundation',
    subtitle: 'Classroom / Online Class',
    imagePath: '/uploads/banners/sda-shp-09-10-2025',
    order: 8,
    backgroundColor: '#fef3c7',
    textColor: '#1e40af'
  }
];

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const setSelected = useSelectedCourse((s) => s.setSelected);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  type CardShape = {
    id: string | number;
    title: string;
    validUntil: string;
    percent: number;
    _bundle: CourseBundle | any;
    isExpired: boolean;
  };

  const [myCourses, setMyCourses] = useState<CardShape[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const idCardNo = useMemo(() => {
    const u: any = session?.user || {};
    return u?.id_card_no ?? u?.idCardNo ?? '';
  }, [session]);

  const userId = useMemo(() => {
    const u: any = session?.user || {};
    return u?.id;
  }, [session]);

  // ---- Clean navigation: store the bundle in Zustand then navigate (no sessionStorage) ----
  function openDetails(bundle: CourseBundle | any) {
    setSelected(bundle);
    router.push('/study_practice/courses/course_details');
  }
  function openSchedule(bundle: CourseBundle | any) {
    setSelected(bundle);
    router.push('/study_practice/course_schedule');
  }

  const dynamicCounts = useMemo(() => {
    if (recommendedCourses.length === 0) {
      return { totalStudents: 0, completedStudents: 0 };
    }

    const totalStudents = recommendedCourses.reduce((sum, course) => sum + course.total_students, 0);
    const completedStudents = recommendedCourses.reduce((sum, course) => sum + course.completed_students, 0);

    return {
      totalStudents: totalStudents || 0,
      completedStudents: completedStudents || 0
    };
  }, [recommendedCourses]);

  // Handle recommended course enrollment
  async function handleEnrollRecommended(course: any) {
    try {
      // Here you would typically call an enrollment API
      message.success(`Enrolling in ${course.title}...`);
      // For now, just show a success message
      console.log('Enrolling in course:', course);
    } catch (error) {
      message.error('Failed to enroll in course');
      console.error('Enrollment error:', error);
    }
  }

  // Load recommended courses
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Keep loading state true while waiting for session/idCardNo
      if (status === 'loading' || !idCardNo) {
        if (mounted && status !== 'loading' && !idCardNo) {
          setRecommendationsLoading(false);
        }
        return;
      }

      try {
        // Loading state already true
        const response = await fetch('/api/courses/course_recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_card_no: idCardNo })
        });

        if (!response.ok) throw new Error(`course_recommendations_api_${response.status}`);

        const payload = await response.json();

        if (mounted && payload.success) {
          setRecommendedCourses(payload.recommendedCourses || []);
        } else {
          // If API returns but not successful, set empty array
          setRecommendedCourses([]);
        }

      } catch (err) {
        if (mounted) {
          console.error('Failed to load recommended courses:', err);
          setRecommendedCourses([]);
        }
      } finally {
        if (mounted) setRecommendationsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [idCardNo, status]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (status === 'loading') return;
      try {
        if (!idCardNo) {
          if (mounted) {
            setMyCourses([]);
            setErrorMsg(null);
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setErrorMsg(null);

        // Build form data (no search params)
        const formData = new FormData();
        formData.append('id_card_no', String(idCardNo));

        const res = await fetch(apiPath('/api/get_users_course_details'), {
          method: 'POST',
          body: formData,
          cache: 'no-store',
        });

        if (!res.ok) {
          let details = '';
          try {
            const body = await res.json();
            details = body?.error || body?.message || '';
          } catch { }
          throw new Error(details || `courses_api_${res.status}`);
        }

        const payload: ApiResponse & { courses?: any[] } = await res.json();

        const rawCourses: any[] = Array.isArray(payload?.courses) ? payload.courses : [];


        const mapped: CardShape[] = rawCourses.map((bundle: any, idx: number) => {
          const c = bundle?.course ? bundle.course : bundle;

          const baseTitle =
            (typeof c?.course_name === 'string' && c.course_name.trim()) ||
            (typeof c?.coursename === 'string' && c.coursename.trim()) || '';

          const variant = typeof c?.variants === 'string' ? c.variants.trim() : '';
          const title = variant ? `${baseTitle} (${variant})` : baseTitle;

          const validDate = c?.validity_date ? new Date(c.validity_date) : null;
          const now = new Date();
          const isExpired = validDate !== null && validDate.getTime() < now.getTime();

          const validUntil = isExpired ? 'Expired' : fmtValidUntil(c?.validity_date ?? null);

          const progressPct =
            (typeof c?.progress?.percentage === 'number' && Number.isFinite(c.progress.percentage))
              ? c.progress.percentage
              : (typeof bundle?.progress?.percentage === 'number' && Number.isFinite(bundle.progress.percentage))
                ? bundle.progress.percentage
                : (typeof c?.overall_percentage === 'number' && Number.isFinite(c.overall_percentage))
                  ? c.overall_percentage
                  : 0;

          const percent = Math.max(0, Math.min(100, Math.round(progressPct)));

          const id = c?.user_course_id ?? c?.course_id ?? c?.id ?? idx;

          return {
            id,
            title: valueOrNA(title),
            validUntil,
            percent,
            _bundle: bundle,
            isExpired,   // ✅ new
          };
        });


        if (mounted) {
          setMyCourses(mapped);
          setErrorMsg(null);
        }
      } catch (e: any) {
        if (mounted) {
          setMyCourses([]);
          setErrorMsg(e?.message || 'Failed to load courses');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [idCardNo, status]);

  const emptyCard = (
    <div className={styles.emptyCard}>
      <span>{errorMsg || 'No courses available'}</span>
    </div>
  );

  return (
    <main className={styles.container}>
      {/* Breadcrumb Section */}
      <div className={styles.topbar}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/student" className={styles.breadLink}>
            Dashboard
          </Link>
          <span className={styles.sep}> | </span>
          <span className={styles.breadCurrent}>My all courses</span>
        </div>

        <Button
          type="default"
          className={styles.backBtn}
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard/student')}
        >
          Back
        </Button>
      </div>

      <div className={styles.hairline} />

      {/* Featured Courses Section */}
      <section className={styles.featuredSection}>
        <FeaturedCourseGrid courses={featuredCourses} />
      </section>

      {/* My All Courses Section */}
      <section>
        <div className={isLoading ? styles.gridLoading : styles.grid}>
          {isLoading ? (
            <>
              <CourseCard.Skeleton />
              <CourseCard.Skeleton />
              <CourseCard.Skeleton />
            </>
          ) : myCourses.length > 0 ? (
            myCourses.map(c => (
              <CourseCard
                key={c.id}
                title={c.title}
                validUntil={c.validUntil}
                percent={c.percent}
                bundle={c._bundle}
                isExpired={c.isExpired}
                onOpenDetails={() => !c.isExpired && openDetails(c._bundle)}
                onStart={() => !c.isExpired && openSchedule(c._bundle)}
              />
            ))
          ) : (
            emptyCard
          )}
        </div>
      </section>

      {/* Divider */}
      <div className={styles.hairline} />

      {/* Recommended Courses Section */}
      <section className={styles.recommendedSection}>
        <h2 className={styles.recommendedTitle}>Recommended Courses</h2>
        {/* <p className={styles.recommendedDescription}>
          Based on your interests, explore courses chosen by <strong>{dynamicCounts.totalStudents} students</strong> - <strong>{dynamicCounts.completedStudents} have completed them with great satisfaction!</strong>
        </p> */}

        <div className={styles.recommendedGrid}>
          {recommendationsLoading ? (
            <>
              <CourseCard.Skeleton />
              <CourseCard.Skeleton />
              <CourseCard.Skeleton />
            </>
          ) : (
            <>
              {recommendedCourses.length > 0 ? (
                recommendedCourses.map((course: RecommendedCourse) => {
                  // DEBUG: Log image data
                  console.log('🔍 Course Image Data:', {
                    courseName: course.coursename,
                    imageFromDB: course.image,
                    inalImageUrl: course.image || '/images/courses/default.jpeg',
                    hasImageInDB: !!course.image
                  });

                  return (
                    <CourseOfferCard
                      key={course.course_id}
                      imageUrl={course.image || '/images/courses/default.jpeg'}
                      title={course.coursename}
                      subtitle={course.original_name}
                      price={course.price || 0}
                      offerPrice={course.offer_price || undefined}
                      offerEndTime={course.offer_end_time || undefined}
                      currencySymbol="₹"
                      onClick={() => handleEnrollRecommended(course)}
                    />
                  );
                })
              ) : (
                <div className={styles.noRecommendations}>
                  <p>No recommendations available at the moment.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
