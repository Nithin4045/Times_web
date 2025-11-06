import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Buffer } from "buffer";

const PYTHON_SERVER = (process.env.NEXT_PUBLIC_PYTHON_SERVER || "").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate and extract inputType
    const inputTypeEntry = formData.get("inputType");
    if (typeof inputTypeEntry !== "string") {
      return NextResponse.json(
        { error: "inputType field is required and must be a string." },
        { status: 400 }
      );
    }
    const inputType = inputTypeEntry;

    // Optional num_questions
    const numQuestionsEntry = formData.get("num_questions");
    const numQuestions =
      typeof numQuestionsEntry === "string"
        ? Number(numQuestionsEntry)
        : undefined;

    // Validate and extract file
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "file field is required and must be a file upload." },
        { status: 400 }
      );
    }
    const file = fileEntry;

    console.log(`📥 Received file: ${file.name} (${file.size} bytes), type=${inputType}`);

    // Read file bytes for forwarding and (if needed) base64 encoding
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Forward to Python server
    const pythonFormData = new FormData();
    pythonFormData.append("input_type", inputType);
    if (numQuestions !== undefined && !Number.isNaN(numQuestions)) {
      pythonFormData.append("num_questions", String(numQuestions));
    }
    pythonFormData.append("file", blob, file.name);

    const pythonUrl = `${PYTHON_SERVER}/generate_mcqs/generate-questions`;
    console.log(`🚀 Forwarding to Python server at: ${pythonUrl}`);

    const pyResponse = await fetch(pythonUrl, {
      method: "POST",
      body: pythonFormData,
    });

    if (!pyResponse.ok) {
      const errorText = await pyResponse.text();
      console.error("❌ Python server error:", errorText);
      return NextResponse.json(
        { error: "Python server error", details: errorText },
        { status: 502 }
      );
    }

    const pyData = await pyResponse.json();
    console.log("✅ Python server response:", pyData.mcqs);

    if (Array.isArray(pyData)) {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return NextResponse.json(
        {
          mcqs: pyData,
          content_base64: base64,
          filename: file.name,
        },
        { status: 200 }
      );
    }

    // Otherwise expect { mcqs, content_base64, filename }
    const { mcqs, content_base64, filename } = pyData as {
      mcqs?: any;
      content_base64?: string;
      filename?: string;
    };

    if (
      !Array.isArray(mcqs) ||
      typeof content_base64 !== "string" ||
      typeof filename !== "string"
    ) {
      console.error("❌ Incomplete data from Python server:", pyData);
      return NextResponse.json(
        { error: "Incomplete data from Python server" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { mcqs, content_base64, filename },
      { status: 200 }
    );
    
  } catch (err: any) {
    console.error("🔥 Unexpected error in Next.js route:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
