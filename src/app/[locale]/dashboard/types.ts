/** ───────── Dashboard (pages_json) Types ───────── */
export type StatItem = {
  key: string;
  value: string | number;
  label: string;
  suffix?: string;
  image?: string;
};

export type TileItem = {
  key: string;
  title: string;
  desc: string;
  href: string;
  image?: string;
};

export type NextClassRoutingEntry = {
  /** Internal templated path, e.g. "/dashboard/course/{course.course}/sessions/{schedule.id}" */
  path?: string;
  /** Direct URL or keyword like "live_url" that maps to schedule.live_url */
  url?: string;
};

export type DashboardShape = {
  greeting?: { period?: string; userName?: string; tagline?: string; examTag?: string, title: string };
  nextClass?: {
    mode?: string;
    name?: string;
    startsIn?: string;
    urls?: Record<string, string>;
    labels?: Record<string, string>;
    routing?: Record<string, NextClassRoutingEntry>; // keys like CLASSROOM, ONLINELIVE, DEFAULT
  };
  stats?: StatItem[];
  tiles?: TileItem[];
};

/** ───────── API: /api/dashboard/get_users_course_details ───────── */
export type ScheduleRow = {
  id: number;
  course: string;
  batch_code: string;
  city_center: number;
  material_code: string;
  scheduled_date_time: string; // ISO
  live_url: string | null;
  video: string | null;
  course_topic_id: number;
};

export type Topic = {
  id: number;
  order: number;
  topic_name: string;
  duration_days: number;
  schedules: ScheduleRow[];
};

export type CourseInfo = {
  user_course_id: number;
  id_card_no: string | null;
  course_id: string;
  variants: string;
  batch_code_input: string;
  batch_code_resolved: string;
  registration_date: string;
  payment: string;
  city_center?: number;
  completed_topics?: string; // "1,3,5"
  progress?: number;
};

export type CourseBundle = {
  course: CourseInfo;
  topics: Topic[];
};

export type NextClassPick =
  | {
      course: CourseInfo;
      topic: Topic;
      schedule: ScheduleRow;
    }
  | null;

export type CoursesResponse = {
  id_card_no: string | null;
  courses_count: number;
  courses: CourseBundle[];
  next_class: NextClassPick;
  generated_at: string;
  /** Optional fields when server returns informational messages or errors */
  message?: string;
  error?: string;
  hint?: string;
};
