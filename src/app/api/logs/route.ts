// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  extractRequestContext,
  type LogEventInput,
  type LogLevel,
  type LogCategory,
  type LogOutcome,
} from '@/lib/auditLogger';

// Optional; remove if you don't need a region hint
export const preferredRegion = ['bom1'];

// --- helpers (internal; NOT exported) ---
const LEVELS = ['TRACE','DEBUG','INFO','WARN','ERROR','FATAL'] as const;
const CATEGORIES = ['AUTH','USER_ACTION','API','SYSTEM','DB','JOB','SECURITY','OTHER'] as const;
const OUTCOMES = ['SUCCESS','FAILURE','DENY','ERROR','TIMEOUT'] as const;

function castLevel(v: unknown): LogLevel | undefined {
  return (typeof v === 'string' && (LEVELS as readonly string[]).includes(v)) ? (v as LogLevel) : undefined;
}
function castCategory(v: unknown): LogCategory | undefined {
  return (typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)) ? (v as LogCategory) : undefined;
}
function castOutcome(v: unknown): LogOutcome | undefined {
  return (typeof v === 'string' && (OUTCOMES as readonly string[]).includes(v)) ? (v as LogOutcome) : undefined;
}
function parseEventAt(v: unknown): Date | undefined {
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

type PostBody = {
  action: string;
  category?: string;
  level?: string;
  outcome?: string;
  message?: string;
  status_code?: number;
  event_at?: string;

  request_id?: string;
  session_id?: string;
  ip?: string;
  user_agent?: string;
  origin?: string;
  method?: string;
  url?: string;
  latency_ms?: number;

  actor_user_id?: number;
  actor_id_card_no?: string;
  actor_role?: string;

  resource_type?: string;
  resource_id?: string;

  error_code?: string;
  error_detail?: string;

  data?: Record<string, unknown>;
  diff_before?: Record<string, unknown> | null;
  diff_after?: Record<string, unknown> | null;
  tags?: string[];
};

export async function POST(req: NextRequest) {
  // Read/validate body
  let body: PostBody | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() });
  }
  if (!body || typeof body.action !== 'string' || !body.action.trim()) {
    return NextResponse.json({ ok: false, error: '`action` is required' }, { status: 400, headers: corsHeaders() });
  }

  // Pull request context and use as defaults
  const ctx = extractRequestContext(req);

  // Build a LogEventInput with properly typed unions
  const payload: LogEventInput = {
    action: body.action.trim(),
    category: castCategory(body.category),
    level: castLevel(body.level),
    outcome: castOutcome(body.outcome),
    message: body.message,
    status_code: body.status_code,
    event_at: parseEventAt(body.event_at),

    request_id: body.request_id,
    session_id: body.session_id,
    ip: body.ip ?? ctx.ip,
    user_agent: body.user_agent ?? ctx.user_agent,
    origin: body.origin ?? ctx.origin,
    method: body.method ?? ctx.method,
    url: body.url,
    latency_ms: body.latency_ms,

    actor_user_id: body.actor_user_id,
    actor_id_card_no: body.actor_id_card_no,
    actor_role: body.actor_role,

    resource_type: body.resource_type,
    resource_id: body.resource_id,

    error_code: body.error_code,
    error_detail: body.error_detail,

    data: body.data,
    diff_before: body.diff_before ?? undefined,
    diff_after: body.diff_after ?? undefined,
    tags: body.tags,
  };

  try {

    // BigInt-safe response (convert id to string)
    return NextResponse.json(
      { ok: true, },
      { status: 201, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {

    return NextResponse.json(
      { ok: false, error: 'Failed to write log' },
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    );
  }
}
