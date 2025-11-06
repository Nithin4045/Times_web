import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ---------- types ----------
type ReplicationRow = {
  paper_id: string;
  question_id: string;
  parent_id: number | null;
  tempParentKey: string | null; // null for roots (main question), non-null for children
  tempKey: string;              // unique temporary key to stitch parent-child
  question: string;
  options: string;              // JSON stringified array
  correct_ans: string;
  applied_edits: string | null;
  solution: string | null;
  prompt: string | null;
  user_id: number;
  job_id: number;
};

// ---------- helpers ----------
function isRecordStringString(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== 'object') return false;
  return Object.entries(v as Record<string, unknown>).every(
    ([k, val]) => typeof k === 'string' && typeof val === 'string'
  );
}

function safeStringify(v: unknown) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Runtime guard for Prisma errors without importing Prisma runtime classes */
function isPrismaError(err: unknown): err is { code?: string; meta?: any; message?: string } {
  return !!err && typeof err === 'object' && 'code' in (err as any);
}

/** Mask / trim large fields for logging while preserving structure */
function maskForLog(obj: any) {
  if (obj == null) return obj;
  if (typeof obj !== 'object') return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    if (k === 'id' || k === '_id') continue;
    const v = obj[k];
    if (typeof v === 'string') {
      if (v.length > 300) {
        const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(v);
        if (base64Like && v.length > 1000) {
          clone[k] = `<${v.length} chars base64-like masked>`;
        } else {
          clone[k] = v.slice(0, 200) + '...<truncated>...';
        }
      } else {
        clone[k] = v;
      }
    } else if (Array.isArray(v)) {
      clone[k] = v.map((it) => maskForLog(it));
    } else if (typeof v === 'object' && v !== null) {
      clone[k] = maskForLog(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

// ---------- main handler ----------
export async function POST(request: Request) {
  let job_id: number | null = null;

  try {
    const body = await request.json();
    console.log('Palms DB Upload Replication Body (masked): ', maskForLog(body));

    const {
      input_type: raw_input_type,
      enriched_mcqs: raw_enriched_mcqs,
      user_id: raw_user_id,
      field_map: raw_field_map,
      job_id: raw_job_id,
      paper_id: raw_paper_id, // <-- new from Python
    } = body || {};

    // normalize job_id (keep numeric if provided)
    if (raw_job_id !== undefined && raw_job_id !== null) {
      const parsed = Number(raw_job_id);
      if (Number.isFinite(parsed)) job_id = parsed;
    }

    // normalize inputs
    const input_type: string = (raw_input_type as string) || 'direct';
    const enriched_mcqs: any[] = Array.isArray(raw_enriched_mcqs) ? raw_enriched_mcqs : [];
    const user_id: number = Number(raw_user_id) || 0;
    const field_map = isRecordStringString(raw_field_map) ? raw_field_map : {};
    const paper_id: string =
      typeof raw_paper_id === 'string' ? raw_paper_id : String(raw_paper_id ?? '');

    // quick guard
    if (!user_id || !Array.isArray(enriched_mcqs) || enriched_mcqs.length === 0) {
      const errResp = {
        success: false,
        error: 'Invalid payload',
        details: 'user_id must be set and enriched_mcqs must be a non-empty array.',
        job_id,
      };
      if (job_id) {
        try {
          await prisma.generate_jobs.update({
            where: { id: job_id },
            data: { status: 'error', response_data: safeStringify(errResp) },
          });
        } catch {}
      }
      return NextResponse.json(errResp, { status: 400 });
    }

    // --- DB transaction with BULK OPERATIONS for better performance ---
    let insertCount = 0;
    let replicatedInsertCount = 0;

    // ✅ Optimized: Collect all records first, then bulk insert
    const allRecordsToInsert: ReplicationRow[] = [];

    // Helper function to recursively collect replications with parent_id
    const collectReplicationsRecursive = (
      replication: any,
      paper_id: string,
      question_id: string,
      parent_id: number | null,
      user_id: number,
      jobId: number,
      tempParentKey?: string
    ): void => {
      // Generate a temporary key for this replication
      const parentTempKey = tempParentKey || `main_${question_id}`;
      const currentKey = `${parentTempKey}_${allRecordsToInsert.length}`;

      // Collect current replication
      allRecordsToInsert.push({
        paper_id,
        question_id,
        parent_id,
        tempParentKey: parentTempKey, // Used to link parent-child after insert
        tempKey: currentKey,
        question: String(replication?.question ?? ''),
        options: JSON.stringify(Array.isArray(replication?.options) ? replication.options : []),
        correct_ans: String(replication?.correct_ans ?? replication?.answer ?? ''),
        applied_edits: (replication?.key ?? replication?.field ?? replication?.type ?? null) as
          | string
          | null,
        solution: (replication?.solution ?? null) as string | null,
        prompt: typeof replication?.prompt === 'string' ? replication.prompt : null,
        user_id,
        job_id: jobId,
      });

      // Recursively collect nested replications (children)
      const nestedReplications: any[] = Array.isArray(replication?.replications)
        ? replication.replications
        : [];
      for (const nestedRep of nestedReplications) {
        collectReplicationsRecursive(
          nestedRep,
          paper_id,
          question_id,
          null,
          user_id,
          jobId,
          currentKey
        );
      }
    };

    // STEP 1: Collect all records to insert
    for (const item of enriched_mcqs) {
      const question_id =
        item?.question_id || `${paper_id}_${Math.random().toString(36).substr(2, 9)}`;
      const mainKey = `main_${question_id}`;

      // Collect MAIN/ORIGINAL question first (parent_id = null)
      allRecordsToInsert.push({
        paper_id,
        question_id,
        parent_id: null, // This is the root/main question
        tempKey: mainKey,
        tempParentKey: null,
        question: String(item?.question ?? ''),
        options: JSON.stringify(Array.isArray(item?.options) ? item.options : []),
        correct_ans: String(item?.correct_ans ?? item?.answer ?? ''),
        applied_edits: null, // Main question has no transformations
        solution: (item?.solution ?? null) as string | null,
        prompt: null,
        user_id,
        job_id: job_id || 0,
      });

      // Collect all transformations/replications
      const replicationsArr: any[] = Array.isArray(item?.replications) ? item.replications : [];
      for (const rep of replicationsArr) {
        collectReplicationsRecursive(rep, paper_id, question_id, null, user_id, job_id || 0, mainKey);
      }

      insertCount++;
    }

    // STEP 2: Bulk insert in batches (PostgreSQL has a limit on parameters)
    const BATCH_SIZE = 500; // Insert 500 records at a time
    const batches: ReplicationRow[][] = [];
    for (let i = 0; i < allRecordsToInsert.length; i += BATCH_SIZE) {
      batches.push(allRecordsToInsert.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `✅ Optimized: Prepared ${allRecordsToInsert.length} records in ${batches.length} batches for bulk insert`
    );

    await prisma.$transaction(
      async (tx) => {
        const insertedMap = new Map<string, number>(); // tempKey -> actual DB id

        for (const batch of batches) {
          // Insert main questions first (parent_id = null)
          const mainQuestions = batch.filter((r) => r.parent_id === null && r.tempParentKey === null);
          if (mainQuestions.length > 0) {
            const mainResults = await tx.replicated_questions.createManyAndReturn({
              data: mainQuestions.map(({ tempKey, tempParentKey, ...rest }) => rest),
            });
            mainResults.forEach((result: { id: number }, idx: number) => {
              insertedMap.set(mainQuestions[idx].tempKey, result.id);
            });
            replicatedInsertCount += mainResults.length;
            console.log(`✅ Bulk inserted ${mainResults.length} main questions`);
          }

          // Insert child replications with resolved parent_id
          const childReplications = batch.filter((r) => r.tempParentKey !== null);
          if (childReplications.length > 0) {
            // Resolve parent_id from insertedMap
            const childData = childReplications.map(({ tempKey, tempParentKey, ...rest }) => ({
              ...rest,
              parent_id: insertedMap.get(tempParentKey as string) ?? null,
            }));

            const childResults = await tx.replicated_questions.createManyAndReturn({
              data: childData,
            });
            childResults.forEach((result: { id: number }, idx: number) => {
              insertedMap.set(childReplications[idx].tempKey, result.id);
            });
            replicatedInsertCount += childResults.length;
            console.log(`✅ Bulk inserted ${childResults.length} child replications`);
          }
        }
      },
      { timeout: 60000 } // ✅ Increase transaction timeout to 60 seconds
    );

    // success response
    const responseData = {
      success: true,
      message: 'AI Questions generated successfully',
      details: `Inserted ${replicatedInsertCount} rows into replicated_questions and ${insertCount} child rows into AiQuestion`,
      replicated_questions_inserted: replicatedInsertCount,
      ai_question_children_inserted: insertCount,
      paper_id, // <-- returned for tracing
      field_map,
      job_id,
    };

    if (job_id) {
      try {
        await prisma.generate_jobs.update({
          where: { id: job_id },
          data: { status: 'success', response_data: safeStringify(responseData) },
        });
      } catch {
        // ignore generate_jobs update failure
      }
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('POST /api/palms_db/upload_replication failed:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
      prismaMeta: isPrismaError(err) ? (err as any).meta : undefined,
      prismaCode: isPrismaError(err) ? (err as any).code : undefined,
    });

    const errorResponse = {
      success: false,
      error: 'Failed to process AI questions',
      details: err?.message,
      job_id,
    };

    if (job_id) {
      try {
        await prisma.generate_jobs.update({
          where: { id: job_id },
          data: { status: 'error', response_data: safeStringify(errorResponse) },
        });
      } catch {
        // ignore
      }
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
