// /store/paymentStore.ts
export const paymentStatusStore: {
  [key: string]: {
    status: string;
    user_id?: string | null;
    course_id?: string | null;
    grade?: string | null; // Allow null to match localStorage.getItem
    payment_request_id?: string;
    data?: any;
  };
} = {};