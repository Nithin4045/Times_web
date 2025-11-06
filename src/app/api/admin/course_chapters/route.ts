// src/app/api/admin/course_chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function parseBody(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await req.json(); } catch { return {}; }
  }
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) obj[k] = typeof v === "string" ? v : "";
    return obj;
  }
  try { return await req.json(); } catch { return {}; }
}

export async function GET(req: NextRequest) {
  console.log("GET /api/admin/course_chapters called", new Date().toISOString());
  try {
    const { searchParams } = new URL(req.url);
    const courseIdStr = searchParams.get("course_id");
    const idStr = searchParams.get("id");

    const where: any = {};
    if (courseIdStr) {
      const courseId = Number(courseIdStr);
      if (Number.isNaN(courseId)) {
        return NextResponse.json({ success: false, error: "course_id must be a number" }, { status: 400 });
      }
      // Search for courseId in the course_id array
      where.course_id = { has: courseId };
    }
    if (idStr) {
      const id = Number(idStr);
      if (Number.isNaN(id)) {
        return NextResponse.json({ success: false, error: "id must be a number" }, { status: 400 });
      }
      where.id = id;
    }

    // Fetch chapters with the filter, ordered by order field
    const rows = await prisma.course_chapters.findMany({
      where,
      orderBy: { order: "asc" },
    });

    console.log(`Found ${rows.length} chapters for course ${courseIdStr}`);

    // Get all unique topic IDs from all chapters
    const allTopicIds = Array.from(new Set(
      rows.flatMap(chapter => (chapter.course_topic_id || []) as number[])
    )).filter(id => id != null);

    console.log("Topic IDs to fetch:", allTopicIds);

    // Fetch all topics referenced by these chapters
    const topics = allTopicIds.length > 0 
      ? await prisma.course_topics.findMany({ 
          where: { id: { in: allTopicIds } },
          orderBy: { order: "asc" }
        }) 
      : [];

    console.log(`Fetched ${topics.length} topics`);

    // Create a map for quick topic lookup
    const topicsById = new Map(topics.map(topic => [topic.id, topic]));

    // Transform the data to include expanded topics
    const data = rows.map(chapter => {
      // Get topics for this chapter, maintaining order
      const chapterTopics = (chapter.course_topic_id || [])
        .map((topicId: number) => topicsById.get(topicId))
        .filter(Boolean) // Remove any null/undefined topics
        .sort((a, b) => (a?.order || 0) - (b?.order || 0)); // Sort by topic order

      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
        isactive: chapter.isactive,
        created_at: chapter.created_at?.toISOString() ?? null,
        updated_at: chapter.updated_at?.toISOString() ?? null,
        course_topic_id: chapter.course_topic_id ?? [],
        course_id: chapter.course_id ?? [],
        // Expanded topics with full details
        topics: chapterTopics,
      };
    });

    console.log(`Returning ${data.length} chapters with expanded topics`);

    return NextResponse.json({ 
      success: true, 
      data,
      debug: {
        courseId: courseIdStr,
        chaptersFound: rows.length,
        topicIdsFound: allTopicIds,
        topicsFound: topics.length
      }
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/course_chapters error", err);
   let message = "Unknown error";
  if (err instanceof Error) {
    message = err.message;
  }
  return NextResponse.json(
    { success: false, error: "Internal Server Error", details: message },
    { status: 500 }
  );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });

    // course_id: single number expected from client; store as array
    const courseId = body.course_id != null ? Number(body.course_id) : null;
    const courseIds = Array.isArray(body.course_id) ? body.course_id.map(Number) : (courseId ? [courseId] : []);

    const created = await prisma.course_chapters.create({
      data: {
        title,
        description: body.description ?? null,
        order: body.order != null ? Number(body.order) : 0,
        course_id: courseIds,
        isactive: body.isactive == null ? true : Boolean(body.isactive),
        course_topic_id: [], // initially empty
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/course_chapters error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const id = Number(body.id);
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title ?? "").trim() || undefined;
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.order !== undefined) data.order = Number(body.order);
    if (body.isactive !== undefined) data.isactive = Boolean(body.isactive);
    if (body.course_topic_id !== undefined) {
      // replace the topic ids array completely
      data.course_topic_id = Array.isArray(body.course_topic_id) ? body.course_topic_id.map(Number) : [];
    }
    if (body.course_id !== undefined) {
      // set course ids array
      data.course_id = Array.isArray(body.course_id) ? body.course_id.map(Number) : (body.course_id ? [Number(body.course_id)] : []);
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    const updated = await prisma.course_chapters.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/course_chapters error", err);
    if (err?.code === "P2025") return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let idStr = searchParams.get("id");
    if (!idStr) {
      const body = await parseBody(req);
      idStr = String(body.id ?? "").trim();
    }
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    await prisma.course_chapters.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/course_chapters error", err);
    if (err?.code === "P2025") return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}