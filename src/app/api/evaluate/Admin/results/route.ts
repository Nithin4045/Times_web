import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    console.log("Role received in request:", role);
    const module = "3";
 
    if (!role) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }
 
    // CHANGED: allow ADM, CLGADM, STU if needed
    if (!["ADM", "CLGADM", "STU"].includes(role)) {
      return NextResponse.json(
        { message: "Access denied. Only authorized roles can view results." },
        { status: 403 }
      );
    }
 
    // CHANGED: pass the real role to your DB function instead of hardcoding 'ADM'
    const result = await prisma.$queryRaw<Array<{
      batch_code: string | null;
      test_id: number | null;
      test_description: string | null;
    }>>`
  SELECT
    batch_code,
    test_id,
    test_description::varchar AS test_description
   FROM public.getbatchtestsbyrole(${role}::text, ${module}::text)
 
`;

  // FROM public.getbatchtestsbyrole(${module}::text, ${role}::text)

 
    console.log("Database query result from admin/results:", result);
 
 
    const validRows = result.filter(
      (row) => row.batch_code !== null && row.test_id !== null && row.test_description !== null
    );
 
    if (validRows.length === 0) {
      console.log("No valid rows found.");
      return NextResponse.json({});
    }
 
    const batchMap: Record<string, { TEST_ID: number; TEST_DESCRIPTION: string }[]> = {};
    for (const row of validRows) {
      const batch_code = row.batch_code!;
      const test_id = row.test_id!;
      const test_description = row.test_description!;
 
      if (!batchMap[batch_code]) batchMap[batch_code] = [];
 
      const exists = batchMap[batch_code].some((e) => e.TEST_ID === test_id);
      if (!exists) {
        batchMap[batch_code].push({ TEST_ID: test_id, TEST_DESCRIPTION: test_description });
      }
    }
    console.log("Processed batch map:", batchMap);
    return NextResponse.json(batchMap);
  } catch (error) {
    console.error("Error fetching batch test data:", error);
    return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
  }
}
 
export async function POST(request: Request) {
  try {
    const { test_id, batch_codes } = await request.json();
    console.log("Received in POST:", { test_id, batch_codes });
 
    if (!test_id || !Array.isArray(batch_codes) || batch_codes.length === 0) {
      return NextResponse.json(
        { message: "test_id and batch_codes are required" },
        { status: 400 }
      );
    }
 
    const rows: Array<{ row: any }> = await prisma.$queryRaw`
  SELECT public.p_generate_combined_results(${test_id}::INT, ${batch_codes}::text[]) AS row
`;
 
    // CHANGED: Extract JSON objects for the frontend
    const data = rows.map((r) => r.row);
    console.log("Stored procedure result:", data);
 
    return NextResponse.json({ message: "Results generated successfully", data });
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    return NextResponse.json({ message: "Error generating results" }, { status: 500 });
  }
}
