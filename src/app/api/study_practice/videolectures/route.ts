// src/app/api/study_practice/videolectures/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function parseRequestBody(req: Request): Promise<Record<string, any>> {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("multipart/form-data") && contentType.includes("boundary=")) {
    try {
      const form = await req.formData();
      const out: Record<string, any> = {};
      for (const [k, v] of form.entries()) out[k] = v;
      return out;
    } catch {
      // fallthrough
    }
  }

  if (contentType.includes("application/json") || contentType.includes("text/json")) {
    try {
      const json = await req.json();
      if (json && typeof json === "object") return json as Record<string, any>;
    } catch {
      // fallthrough
    }
  }

  try {
    const txt = await req.text();
    if (!txt) return {};
    // handle urlencoded body
    if (txt.includes("=") && txt.includes("&")) {
      const params = new URLSearchParams(txt);
      const out: Record<string, any> = {};
      for (const [k, v] of params.entries()) out[k] = v;
      return out;
    }
    // try parse JSON fallback
    try {
      const j = JSON.parse(txt);
      if (j && typeof j === "object") return j;
    } catch {
      return { raw: txt };
    }
  } catch {
    // ignore
  }

  return {};
}

function toIntOrNull(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return null;
    return Math.trunc(val);
  }
  const s = String(val).trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * POST -> calls public.get_videolectures(city, center, variant, course)
 * Returns: { videolectures: [...], materials: [...] }
 */
export async function POST(req: Request) {
  try {
    const body = await parseRequestBody(req);

    const cityId = toIntOrNull(body.city_id ?? body.cityId ?? body.city);
    const centerId = toIntOrNull(body.center_id ?? body.centerId ?? body.center);
    const variantId = toIntOrNull(body.variant_id ?? body.variantId ?? body.variant);
    const courseId = toIntOrNull(body.course_id ?? body.courseId ?? body.course);

    console.log("[API] get_videolectures inputs (integers only):", { cityId, centerId, variantId, courseId });

    // Use explicit int casts in SQL so Postgres finds the exact overload
    const sql = `SELECT public.get_videolectures($1::int, $2::int, $3::int, $4::int) AS result;`;

    const rows: Array<{ result: any }> = await prisma.$queryRawUnsafe(sql, cityId, centerId, variantId, courseId);

    if (!rows || rows.length === 0) {
      // No result from DB -> return empty arrays
      return NextResponse.json({ videolectures: [], materials: [] }, { status: 200 });
    }

    let payload = rows[0].result;

    // DB sometimes returns JSON string; try parse
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        // leave as-is
      }
    }

    // normalize payload to an object
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ videolectures: [], materials: [] }, { status: 200 });
    }

    // Helper: find nested array named 'videolectures' or 'video_lectures' etc.
    function extractArray(obj: any, keyNames: string[]): any[] | null {
      for (const k of keyNames) {
        if (Array.isArray(obj[k])) return obj[k];
      }
      // check one level deep keys
      for (const topKey of Object.keys(obj)) {
        try {
          const v = obj[topKey];
          if (v && typeof v === "object") {
            for (const k of keyNames) {
              if (Array.isArray(v[k])) return v[k];
            }
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    const videoLectures =
      extractArray(payload, ["videolectures", "video_lectures", "videoLectures"]) ?? [];

    const materials =
      extractArray(payload, ["materials", "material", "Material", "Materials"]) ?? [];

    // Ensure arrays (defensive)
    const vl = Array.isArray(videoLectures) ? videoLectures : [];
    const mats = Array.isArray(materials) ? materials : [];

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
      console.warn(`[VideoLectures] Unknown video format: ${video}`);
      return null;
    };

    // Process materials to add video_url field
    const processedMaterials = mats.map((material: any) => {
      const videoUrl = getVideoUrl(material.url || material.video || material.video_id);
      console.log('[VideoLectures API] Processing material:', {
        id: material.id,
        title: material.title,
        url: material.url,
        generated_video_url: videoUrl
      });
      return {
        ...material,
        video_url: videoUrl
      };
    });

    // Return both arrays in a single object
    return NextResponse.json({ videolectures: vl, materials: processedMaterials }, { status: 200 });
  } catch (err: any) {
    console.error("[API] get_videolectures error:", err?.message ?? err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch video lectures",
        detail: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
