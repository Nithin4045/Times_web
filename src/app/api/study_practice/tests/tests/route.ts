// src/app/api/study_practice/tests/tests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodestr } from "@/lib/obfuscator";

export const dynamic = "force-dynamic";

function safeIsString(v: unknown): v is string {
  return typeof v === "string";
}

type ProcessedTestLinkEntry = {
  status: boolean;
  test_link: string | null;
  vendorName?: string | null;
  [key: string]: unknown;
};

function transformTestLink(
  rawLink: string | null | undefined,
  idCardNo: string,
  testRef?: string | number | null,
  testName?: string | null,
): string | null {
  if (!safeIsString(rawLink)) return rawLink ?? null;

  let link = rawLink.trim();
  if (!link.length) return null;

  // Check if this is an AIMCAT test by exact match
  const isAimcat = testName && String(testName).toLowerCase() === 'aimcat';

  if (isAimcat && testRef) {
    // Generate AIMCAT-specific URL format
    const encodedIdCard = encodestr(idCardNo);
    const encodedTestRef = encodestr(String(testRef));
    
    return `https://www.time4education.com/my/aimcatlivetest.asp?idcardno=${encodedIdCard}&testno=${encodedTestRef}&pge=5e5e570e5e5e57065e5e57025e5e570c5e5e570e5e5e571b5e5e57&ttype=5e5e57085e5e57065e5e57015e5e57085e5e570a5e5e571d5e5e57`;
  }

  if (link.toLowerCase().includes("<id_card_no>")) {
    link = link.replace(/<id_card_no>/gi, idCardNo);
  }

  const lower = link.toLowerCase();

  if (lower.includes("t4etests.time4education.com")) {
    let updated = link.replace("/NA/", `/${idCardNo}/`);
    if (/sno=$/i.test(updated)) {
      updated = `${updated}${idCardNo}`;
    } else if (/(sno=)[^&]*/i.test(updated)) {
      updated = updated.replace(/(sno=)[^&]*/i, `$1${idCardNo}`);
    }
    return updated;
  }

  if (!lower.includes("onlinetests.time4education.com")) {
    return link;
  }

  const encoded = encodestr(idCardNo);

  if (link.includes(idCardNo)) {
    link = link.split(idCardNo).join(encoded);
  }

  if (link.endsWith(idCardNo)) {
    link = link.slice(0, -idCardNo.length);
  }

  if (/LoginID=$/i.test(link)) {
    link = `${link}${encoded}`;
  } else if (/(LoginID=)[^&]*/i.test(link)) {
    link = link.replace(/(LoginID=)[^&]*/i, `$1${encoded}`);
  }

  if (!link.includes(encoded)) {
    const suffix = link.endsWith("/") ? "" : "/";
    link = `${link}${suffix}${encoded}`;
  }

  return link;
}

function normalizeTestLinks(
  raw: unknown,
  idCardNo: string,
  testRef?: string | number | null,
  testName?: string | null,
): { entries: ProcessedTestLinkEntry[]; primary: string | null } {
  let items: unknown[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (safeIsString(raw)) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed;
        }
      } catch (error) {
        console.warn("normalizeTestLinks: failed to parse JSON string", {
          error,
        });
      }
    } else if (trimmed.length > 0) {
      items = [{ status: true, test_link: trimmed }];
    }
  } else if (raw && typeof raw === "object") {
    items = [raw];
  }

  const entries: ProcessedTestLinkEntry[] = items.map((entry) => {
    const obj =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};

    const statusRaw = obj.status;
    const status =
      typeof statusRaw === "boolean"
        ? statusRaw
        : statusRaw != null
          ? String(statusRaw).toLowerCase() === "true"
          : false;

    const originalLink = safeIsString(obj.test_link) ? obj.test_link : null;
    const transformedLink = transformTestLink(originalLink, idCardNo, testRef, testName);

    const vendorRaw = obj.vendorName;
    const vendorName = safeIsString(vendorRaw)
      ? vendorRaw
      : vendorRaw != null
        ? String(vendorRaw)
        : null;

    return {
      ...obj,
      status,
      test_link: transformedLink,
      vendorName,
    } as ProcessedTestLinkEntry;
  });

  const primary =
    entries.find(
      (entry) =>
        entry.status && entry.test_link && entry.test_link.trim().length > 0,
    )?.test_link ?? null;

  return { entries, primary };
}

function transformTestsArray(
  arr: any[] | null | undefined,
  idCardNo: string,
): any[] {
  if (!Array.isArray(arr)) return [];

  return arr.map((t) => {
    if (t && typeof t === "object") {
      const newObj: Record<string, unknown> = { ...t };
      // Extract test_ref with proper type checking
      const testRef: string | number | null = typeof newObj.test_ref === 'string' || typeof newObj.test_ref === 'number' 
        ? newObj.test_ref as string | number
        : null;
      
      // Extract test name for AIMCAT detection
      const testName: string | null = typeof newObj.name === 'string' 
        ? newObj.name 
        : null;
      
      const { entries, primary } = normalizeTestLinks(
        newObj.test_link,
        idCardNo,
        testRef, // Pass test_ref for AIMCAT URL generation
        testName, // Pass test name for AIMCAT detection
      );
      newObj.test_link = entries;
      newObj.primary_link = primary;
      newObj.has_primary_link = Boolean(primary);
      return newObj;
    }

    return t;
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const idCardNo = (form.get("id_card_no") ?? "").toString().trim();
    const areaLevelRaw = form.get("area_level_id");
    const areaLevelId = areaLevelRaw != null ? Number(areaLevelRaw) : NaN;
    
    const courseIdRaw = form.get("course_id");
    let courseId: number | null = null;
    if (courseIdRaw) {
      const parsed = Number(courseIdRaw);
      if (Number.isInteger(parsed)) {
        courseId = parsed;
      }
    }

    const batchIdRaw = form.get("batch_id");
    let batchId: number | null = null;
    if (batchIdRaw) {
      const parsed = Number(batchIdRaw);
      if (Number.isInteger(parsed)) {
        batchId = parsed;
      }
    }

    if (!idCardNo || !Number.isFinite(areaLevelId)) {
      console.warn("[tests] missing/invalid inputs", {
        id_card_no: idCardNo,
        area_level_id: areaLevelRaw,
        course_id: courseIdRaw,
        batch_id: batchIdRaw,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid id_card_no / area_level_id",
        },
        { status: 400 },
      );
    }

    // Call function with course_id and batch_id parameters
    const rows = await prisma.$queryRaw<
      Array<{ data: { pending?: any[]; completed?: any[] } }>
    >`
      SELECT public.get_tests_pending_completed(
        ${idCardNo}::text,
        ${areaLevelId}::int,
        ${courseId}::int,
        ${batchId}::int
      ) AS data
    `;
    
    const dbPayload = rows?.[0]?.data ?? { pending: [], completed: [] };
    
    const pendingRaw = dbPayload.pending ?? [];
    const completedRaw = dbPayload.completed ?? [];

    const pending = transformTestsArray(pendingRaw, idCardNo);
    const completed = transformTestsArray(completedRaw, idCardNo);

    return NextResponse.json(
      {
        success: true,
        pending,
        completed,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[tests] failed to fetch", {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch tests by status" },
      { status: 500 },
    );
  }
}
