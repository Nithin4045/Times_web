"use client";
import { useRouter } from "next/navigation";
import useTestStore from "@/store/evaluate/teststore";

export default function FeedbackPage() {
  const { testId } = useTestStore();
  const router = useRouter();

  const handleFeedbackSubmit = () => {
    router.push("/evaluate/thankyou");
  };

  // Render nothing
  return null; // or: return <></>;
}
