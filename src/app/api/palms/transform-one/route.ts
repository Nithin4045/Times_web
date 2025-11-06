// app/api/transform-one/route.ts
import { NextResponse } from "next/server";

const PY_BASE = process.env.PYTHON_SERVER || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation (id, question, options[4], correct_answer, prompt)
    if (
      !body ||
      typeof body.id !== "string" ||
      typeof body.question !== "string" ||
      !Array.isArray(body.options) ||
      body.options.length !== 4 ||
      typeof body.correct_answer !== "string" ||
      typeof body.prompt !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payload. Expect {id, question, options[4], correct_answer, prompt}." },
        { status: 400 }
      );
    }

    const resp = await fetch(`${PY_BASE}/palms/transform-one`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.detail || "Python API error" },
        { status: resp.status }
      );
    }

    // Expected shape from FastAPI: {id, question, options, answer, answer_index}
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Proxy error: ${e?.message || String(e)}` },
      { status: 500 }
    );
  }
}
