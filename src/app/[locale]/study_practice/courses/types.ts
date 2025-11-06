export type ScheduleRow = {
  id: number;
  course: string;
  batch_code: string;
  city_center: number;
  material_code: string;
  scheduled_date_time: string;
  live_url: string | null;
  video: string | null;
  course_topic_id: number;
};
export type Topic = {
  id: number;
  order: number;
  topic_name: string;
  duration_days: number;
  percentage?: number | null;
  schedules: ScheduleRow[];
};
export type CourseInfo = {
  user_course_id: number;
  id_card_no: string;
  course_pk: number;
  course_id: string;
  course_name: string;
  variants: string;
  batch_code_input: string;
  batch_code_resolved: string;
  registration_date: string;
  payment: string;
  city_center?: number;
  validity_date?: string;
  completed_topics?: string;
  progress?: number;
};
export type CourseBundle = { course: CourseInfo; topics: Topic[], overall_percentage: number};

export type ApiResponse = {
  id_card_no: string;
  courses_count: number;
  courses: CourseBundle[];
  next_class: null | {
    course: CourseInfo;
    topic: Topic;
    schedule: ScheduleRow;
  };
  generated_at: string;
  message?: string;
};