// FILE: src/app/api/evaluate/Admin/ManageTestRepositoryDetails/Dropdownvlaues/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    // CHANGE: subjects now mirrors topics: explicit select, deterministic order,
    // and returns a *plain array* of consistently UPPERCASED keys that the UI will use.
    if (type === "subjects") {
      const rows = await prisma.subjects.findMany({
        select: {
          subject_id: true,
          subject_description: true,
          subject_code: true,
          test_type: true,
          require_resource: true,
        },
        orderBy: [{ subject_description: "asc" }],
      });

      const out = rows.map((s) => ({
        SUBJECT_ID: s.subject_id,
        SUBJECT_DESCRIPTION: s.subject_description ?? "",
        SUBJECT_CODE: s.subject_code ?? "",
        TEST_TYPE: s.test_type ?? "",
        REQUIRE_RESOURCE: s.require_resource ?? 0,
      }));

      // CHANGE: return a plain array (not wrapped in { subjects: [...] })
      return NextResponse.json(out, { status: 200 });
    }

    // (unchanged logic, but kept consistent)
    if (type === "topics") {
      const rows = await prisma.topics.findMany({
        select: {
          topic_id: true,
          topic_description: true,
          topic_code: true,
          require_resource: true,
          test_type: true,
        },
        orderBy: [{ topic_description: "asc" }],
      });

      const out = rows.map((t) => ({
        TOPIC_ID: t.topic_id,
        TOPIC_DESCRIPTION: t.topic_description ?? "",
        TOPIC_CODE: t.topic_code ?? "",
        REQUIRE_RESOURCE: t.require_resource ?? 0,
        TEST_TYPE: t.test_type ?? "",
      }));

      // CHANGE: return a plain array (not wrapped in { topics: [...] })
      return NextResponse.json(out, { status: 200 });
    }

    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Dropdownvlaues GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
