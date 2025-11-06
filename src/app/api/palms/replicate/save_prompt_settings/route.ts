// src/app/api/palms/ai-questions/save_prompt_settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type MetaPair = { keyLabel: string; prompt: string };

export const config = {
  api: { bodyParser: false },
};

// GET /api/palms/ai-questions/save_prompt_settings?user_id=123
export async function GET(request: Request) {
  try { 
    const { searchParams } = new URL(request.url);
    const userIdRaw = searchParams.get('user_id');
    if (!userIdRaw) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    console.log('GET save_prompt_settings user_id:', userIdRaw);
    const userId = Number(userIdRaw);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, prompt_settings: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const items = (user.prompt_settings as MetaPair[] | null) ?? [];
    console.log('GET save_prompt_settings:', { userId, items });
    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error('GET save_prompt_settings error:', err);
    return NextResponse.json({ error: 'Failed to fetch prompt settings' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    console.log("=== Incoming save_prompt_settings POST ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      console.warn("Invalid Content-Type:", request.headers.get("content-type"));
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    const userId = Number(body?.user_id);
    const items = body?.items as MetaPair[] | undefined;

    console.log("Parsed userId:", userId, "items length:", items?.length);

    if (!Number.isInteger(userId)) {
      console.warn("Invalid userId:", body?.user_id);
      return NextResponse.json(
        { error: "Invalid or missing user_id" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      console.warn("Items is not an array:", items);
      return NextResponse.json(
        { error: "items must be an array" },
        { status: 400 }
      );
    }

    // Validate each item
    const invalid = items.find(
      (it) =>
        !it ||
        typeof it.keyLabel !== "string" ||
        typeof it.prompt !== "string" ||
        it.keyLabel.trim() === "" ||
        it.prompt.trim() === ""
    );
    if (invalid) {
      console.warn("Invalid item found:", invalid);
      return NextResponse.json(
        { error: "Each item must include non-empty keyLabel and prompt" },
        { status: 400 }
      );
    }

    console.log("Looking up user:", userId);
    const exists = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) {
      console.warn("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Updating user:", userId);
    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        prompt_settings: items, // Uncomment if you want to persist items
        last_login_datetime: new Date(),
      },
      select: { id: true, prompt_settings: true },
    });

    console.log("Update successful:", updated);

    return NextResponse.json(
      {
        success: true,
        user_id: updated.id,
        items: updated.prompt_settings ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST save_prompt_settings error:", err);
    return NextResponse.json(
      { error: "Failed to save prompt settings" },
      { status: 500 }
    );
  }
}