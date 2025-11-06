// app/api/study_practice/courses/course_videos_materials/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

    let idCardNo: string | null = null;
    let batchIdRaw: string | null = null;

    try {
      if (contentType.includes("application/json")) {
        const json = await req.json();
        idCardNo = json?.id_card_no ?? json?.idCardNo ?? null;
        batchIdRaw = json?.batch_id ?? json?.batchId ?? null;
      } else {
        const form = await req.formData();
        idCardNo = (form.get("id_card_no") as string | null) ?? null;
        batchIdRaw = (form.get("batch_id") as string | null) ?? null;
      }
    } catch (err) {
      console.warn("[CourseContent] Failed to parse body as form/json", err);
      return NextResponse.json(
        { success: false, error: "Request body must be multipart/form-data or JSON" },
        { status: 400 }
      );
    }

    const idCard = (idCardNo ?? '').toString().trim();
    const batchIdStr = (batchIdRaw ?? '').toString().trim();

    console.log("[CourseContent] Incoming payload:", {
      id_card_no: idCard,
      batch_id: batchIdStr,
      content_type: contentType,
    });

    if (!idCard || !batchIdStr) {
      console.warn("[CourseContent] Missing id_card_no or batch_id");
      return NextResponse.json(
        { success: false, error: "Missing id_card_no or batch_id" },
        { status: 400 }
      );
    }

    const batchId = Number(batchIdStr);
    if (!Number.isFinite(batchId) || batchId <= 0) {
      console.warn("[CourseContent] Invalid batch_id:", batchIdStr);
      return NextResponse.json(
        { success: false, error: "Invalid batch_id" },
        { status: 400 }
      );
    }

    // Call DB function which returns a JSON payload (jsonb). Use $queryRawUnsafe like before.
    const rows = await prisma.$queryRawUnsafe<{ payload: any }[]>(
      `SELECT get_course_schedules($1::text, $2::int) AS payload`,
      idCard,
      batchId
    );

    const rawPayload = rows?.[0]?.payload ?? null;

    // Some drivers return JSON as string, some return a parsed object.
    let payload: any = rawPayload;
    if (typeof rawPayload === "string") {
      try {
        payload = JSON.parse(rawPayload);
      } catch (err) {
        // if parse fails, keep raw string and continue
        console.warn("[CourseContent] payload is a string but JSON.parse failed:", err);
      }
    }

    // ✅ Helper function to generate video URL based on video ID format
    const getVideoUrl = (videoId: string | null): string | null => {
      if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
        return null;
      }
      
      const video = videoId.trim();
      
      // 1. BUNNY video: Contains hyphens (UUID format: e42ee661-c104-41d1-b01b-65baacbd29da)
      if (video.includes('-')) {
        return `https://www.time4education.com/online_registration/sample_bunny_video.php?id=${video}&crs=CLAT`;
      }
      
      // 2. VideoCipher: Alphanumeric without hyphens (f1ce3f96b739421e87734ee28a583fb5)
      if (/^[a-f0-9]+$/i.test(video) && video.length >= 20) {
        return `https://www.time4education.com/my/videocipher-code.php?videoid=${video}`;
      }
      
      // 3. Vimeo: All numeric (898989954)
      if (/^\d+$/.test(video)) {
        return `https://player.vimeo.com/video/${video}`;
      }
      
      // Fallback: Return null if format doesn't match any known type
      console.warn(`[CourseContent] Unknown video format: ${video}`);
      return null;
    };

    // Safely extract the arrays (default to empty arrays)
    const upcoming = Array.isArray(payload?.upcoming_schedules)
      ? payload.upcoming_schedules.map((schedule: any) => ({
          ...schedule,
          video_url: getVideoUrl(schedule.video), // ✅ Add video URL
        }))
      : [];
    const completed = Array.isArray(payload?.completed_schedules)
      ? payload.completed_schedules.map((schedule: any) => ({
          ...schedule,
          video_url: getVideoUrl(schedule.video), // ✅ Add video URL
        }))
      : [];

    const counts = payload?.counts ?? null;
    const meta = payload?.meta ?? null;

    // Detailed debug log (can remove in prod)
    console.log("[CourseContent] payload meta:", meta);
    console.log("[CourseContent] counts:", counts);
    console.log(
      "[CourseContent] upcoming / completed lengths:",
      upcoming.length,
      completed.length
    );

    return NextResponse.json(
      {
        success: true,
        meta,
        counts,
        upcoming_schedules: upcoming,
        completed_schedules: completed,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[CourseContent] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
