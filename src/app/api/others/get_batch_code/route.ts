import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ make sure your prisma client is in this path

export async function POST(req: NextRequest) {
  try {
    const { batch_id } = await req.json();

    if (!batch_id || typeof batch_id !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing batch_id" },
        { status: 400 }
      );
    }

    // ✅ Fetch the batch code
    const batch = await prisma.batches.findUnique({
      where: { id: batch_id },
      select: { batch_code: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      batch_id,
      batch_code: batch.batch_code,
    });
  } catch (error) {
    console.error("Error fetching batch_code:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
