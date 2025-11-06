// src/app/api/batch/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Expect a batch_id field in the form data
    const batchIdRaw = form.get("batch_id");
    if (!batchIdRaw) {
      return NextResponse.json(
        { error: "Missing batch_id in form data" },
        { status: 400 }
      );
    }

    const batchId = Number(batchIdRaw);
    if (Number.isNaN(batchId)) {
      return NextResponse.json(
        { error: "Invalid batch_id, must be a number" },
        { status: 400 }
      );
    }

    const batch = await prisma.batches.findUnique({
      where: { id: batchId },
      select: { batch_code: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({ batch_code: batch.batch_code });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch batch code", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
