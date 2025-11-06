import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

type TestDetails = {
  test_id: number;
  user_test_id: number;
  test_name: string | null;
  test_description: string | null;
  general_data: string | null;
  user_data: string | null;
  video: string | null;
  epi_data: string | null;
  validity_start: Date | null;
  validity_end: Date | null;
  is_valid: boolean;                // boolean, not number
  total_marks: number | null;       // user's score (nullable when not visible)
  test_total_marks: number | null;  // possible
  distCount: number | null;
  distSecs: number | null;
  modified_date: string | null;
  user_name: string | null;
  ip_restriction: number | null;
  ip_addresses: string | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() || "unknown";

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Important: alias column names to what React expects + cast is_valid to boolean
    const testDetails = await prisma.$queryRaw<TestDetails[]>`
      WITH agg AS (
        SELECT
          ut.user_test_id,
          ut.test_id,
          MAX(utd.modified_date)                                 AS modified_date,
          COALESCE(SUM(utd.marks), 0)::numeric(10,2)             AS sum_marks,
          COALESCE(BOOL_OR(utd.user_test_id IS NOT NULL), false) AS has_attempt
        FROM user_tests ut
        LEFT JOIN user_test_details utd
          ON utd.test_id = ut.test_id
         AND utd.user_test_id = ut.user_test_id
        WHERE ut.user_id = ${Number(userId)}::int
          AND ut.module = '3'
        GROUP BY ut.user_test_id, ut.test_id
      )
      SELECT
        ut.test_id,
        ut.user_test_id,
        ut.test_name,
        tr.test_description,
        tr.general_data,
        ut.validity_start,
        ut.validity_end,
        ut.distsecs   AS "distSecs",
        ut.distcount  AS "distCount",
        ut.epi_data,
        ut.user_data,
        ut.video,
        tr.ip_restriction,
        tr.ip_addresses,
        a.modified_date::text AS modified_date,
        -- boolean is_valid for the UI
        (
          CASE
            WHEN (CURRENT_TIMESTAMP BETWEEN ut.validity_start AND ut.validity_end)
                 AND tr.test_type = 'SINGLE'
                 AND COALESCE(a.has_attempt, false) = false
              THEN true
            WHEN (CURRENT_TIMESTAMP BETWEEN ut.validity_start AND ut.validity_end)
                 AND tr.test_type = 'LOOP'
              THEN true
            ELSE false
          END
        ) AS is_valid,
        (
          CASE
            WHEN NOT (CURRENT_TIMESTAMP BETWEEN ut.validity_start AND ut.validity_end)
              THEN a.sum_marks
            WHEN tr.test_type = 'LOOP'   AND a.has_attempt THEN a.sum_marks
            WHEN tr.test_type = 'SINGLE' AND a.has_attempt THEN a.sum_marks
            ELSE NULL
          END
        )::numeric(10,2) AS total_marks,
        (
          SELECT COALESCE(SUM(trd.subject_marks), 0)
          FROM test_repository_details trd
          WHERE trd.test_id = ut.test_id
        )::int AS test_total_marks
      FROM user_tests ut
      LEFT JOIN test_repository tr
        ON tr.test_id = ut.test_id
      LEFT JOIN agg a
        ON a.user_test_id = ut.user_test_id
       AND a.test_id = ut.test_id
      WHERE ut.user_id = ${Number(userId)}::int
        AND ut.module = '3'
      ORDER BY
        CASE
          WHEN (CURRENT_TIMESTAMP BETWEEN ut.validity_start AND ut.validity_end)
               AND ( (tr.test_type = 'SINGLE' AND COALESCE(a.has_attempt, false) = false)
                  OR   tr.test_type = 'LOOP' )
            THEN 1 ELSE 0 END DESC,
        ut.validity_start DESC;
    `;
    console.log('Fetched test details:', testDetails);
    return NextResponse.json({ data: testDetails, ip });
  } catch (error) {
    logger.error(`Error fetching test details: ${error}`);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
