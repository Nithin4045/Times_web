// app/api/webinars/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const courseIdRaw = form.get("course_id");

    console.log("[Webinars] Incoming form-data:", { course_id: courseIdRaw });

    if (!courseIdRaw) {
      return NextResponse.json(
        { success: false, error: "Missing course_id" },
        { status: 400 }
      );
    }

    const courseId = Number(courseIdRaw);
    if (!Number.isFinite(courseId) || courseId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid course_id" },
        { status: 400 }
      );
    }

    // Cast explicitly to int
    const rows = await prisma.$queryRawUnsafe<
      { get_webinar_videos: any }[]
    >(
      `SELECT get_webinar_videos($1::int) AS get_webinar_videos`,
      courseId
    );

    const rawData = rows?.[0]?.get_webinar_videos ?? null;

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
      console.warn(`[WebinarVideos] Unknown video format: ${video}`);
      return null;
    };

    // Process the data to add video_url field
    let data = rawData;
    if (Array.isArray(rawData)) {
      data = rawData.map((webinar: any) => ({
        ...webinar,
        video_url: getVideoUrl(webinar.video_link || webinar.video),
      }));
    } else if (rawData && typeof rawData === 'object') {
      // Handle case where data might be wrapped in an object
      if (Array.isArray(rawData.webinars)) {
        data = {
          ...rawData,
          webinars: rawData.webinars.map((webinar: any) => ({
            ...webinar,
            video_url: getVideoUrl(webinar.video_link || webinar.video),
          }))
        };
      } else if (Array.isArray(rawData.videolectures)) {
        data = {
          ...rawData,
          videolectures: rawData.videolectures.map((webinar: any) => ({
            ...webinar,
            video_url: getVideoUrl(webinar.video_link || webinar.video),
          }))
        };
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("[Webinars] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
