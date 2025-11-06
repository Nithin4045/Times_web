// types.ts

export interface ScheduleRow {
  video: string | null;
  live_url: string | null;
  material_code: string;
  scheduled_date_time: string; // ISO datetime
}

export interface Topic {
  order: number;
  topic_name: string;
  duration_days: number;
  schedules: ScheduleRow[];
}

export interface Course {
  user_course_id: number;
  id_card_no: string;
  course_id: number;
  course_name: string;
  batch_id: number;
  batch_code: string;
  variants_id: number;
  variants: string;
  registration_date: string; // ISO datetime
  payment: string;
  city_id: number;
  center_id: number;
  validity_date: string; // ISO datetime
  completed_topics: string;
  completed_materials: string;
  completed_live_sessions: string;
  completed_study_resources: string;
  overall_percentage: number;
  topics: Topic[];
}

export interface CoursesResponse {
  success: boolean;
  id_card_no: string;
  courses_count: number;
  courses: Course[];
  next_class: null | {
    course: Course;
    topic: Topic;
    schedule: ScheduleRow;
  };
  generated_at: string; // ISO datetime
  form_name: string | null;
  form: unknown | null;
}
