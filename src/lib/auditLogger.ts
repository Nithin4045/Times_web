// src/lib/auditLogger.ts
import { prisma } from "@/lib/prisma";

/**
 * Enum-like string unions matching your Prisma schema enums.
 * (No runtime import needed; Prisma accepts string literals.)
 */
export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
export type LogCategory =
  | "AUTH"
  | "USER_ACTION"
  | "API"
  | "SYSTEM"
  | "DB"
  | "JOB"
  | "SECURITY"
  | "OTHER";
export type LogOutcome = "SUCCESS" | "FAILURE" | "DENY" | "ERROR" | "TIMEOUT";

/**
 * Strongly-typed input for logging.
 * Provide only what you have; everything is optional except `action`.
 */
export interface LogEventInput {
  // Core event info
  
  action: string;                 // e.g. "SEND_OTP", "LOGIN_ATTEMPT"
  category?: LogCategory;         // default: "OTHER"
  level?: LogLevel;               // default: "INFO"
  outcome?: LogOutcome;           // e.g. "SUCCESS", "DENY"
  message?: string;               // short human message
  status_code?: number;           // HTTP status for API contexts
  event_at?: Date;                // override timestamp if needed

  // Request / runtime context
  request_id?: string;            // if you generate one per request
  session_id?: string;
  ip?: string;
  user_agent?: string;
  origin?: string;                // host/subdomain
  method?: string;                // HTTP method
  url?: string;                   // path or full URL
  latency_ms?: number;

  // Actor (who)
  actor_user_id?: number;         // FK to users.id
  actor_id_card_no?: string;      // mirrors users.id_card_no
  actor_role?: string;            // "ADM" | "STU" | etc.

  // Target (what)
  resource_type?: string;         // e.g. "USER", "ORDER"
  resource_id?: string;           // string to support UUID/Int

  // Error details
  error_code?: string;
  error_detail?: string;

  // Flexible payloads (keep non-sensitive)
  data?: Record<string, unknown>;
  diff_before?: Record<string, unknown> | null;
  diff_after?: Record<string, unknown> | null;
  tags?: string[];                // quick filters (e.g. ["otp","login"])
}

/**
 * Optional: normalize common fields from a Request (Next.js/Fetch API).
 */
export function extractRequestContext(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff ? xff.split(",")[0].trim() : (req.headers.get("x-real-ip") || undefined);
  return {
    ip,
    origin: req.headers.get("host") || undefined,
    user_agent: req.headers.get("user-agent") || undefined,
    method: (req as any).method as string | undefined, // method exists on Next.js Request
    // You can compute url from NextRequest if you use app router's NextRequest
  };
}

/**
 * Core logger: writes a row into event_logs.
 * Returns the created log id & request_id for correlation.
 */
// export async function logEvent(input: LogEventInput): Promise<{ id: bigint; request_id?: string }> {
//   const {
//     action,
//     level = "INFO",
//     category = "OTHER",
//     event_at = new Date(),
//     outcome,
//     message,
//     status_code,
//     request_id = safeRequestId(),
//     session_id,
//     ip,
//     user_agent,
//     origin,
//     method,
//     url,
//     latency_ms,
//     actor_user_id,
//     actor_id_card_no,
//     actor_role,
//     resource_type,
//     resource_id,
//     error_code,
//     error_detail,
//     data,
//     diff_before,
//     diff_after,
//     tags,
//   } = input;

//   if (!action || typeof action !== "string") {
//     throw new Error("logEvent: `action` is required (string).");
//   }

//   // const created = await prisma.event_logs.create({
//   //   data: {
//   //     event_at,
//   //     level,
//   //     category,
//   //     action,
//   //     outcome,
//   //     status_code,
//   //     message,
//   //     request_id,       // we always send a string here
//   //     session_id,
//   //     ip,
//   //     user_agent,
//   //     origin,
//   //     method,
//   //     url,
//   //     latency_ms,
//   //     actor_user_id,
//   //     actor_id_card_no,
//   //     actor_role,
//   //     resource_type,
//   //     resource_id,
//   //     error_code,
//   //     error_detail,
//   //     data: data ? (data as any) : undefined,
//   //     diff_before: diff_before ? (diff_before as any) : undefined,
//   //     diff_after: diff_after ? (diff_after as any) : undefined,
//   //     tags,
//   //   },
//   //   select: { id: true, request_id: true }, // typed as string | null by Prisma
//   // });

//   // Coerce null -> undefined to satisfy the return type
//   // return { id: created.id, request_id: created.request_id ?? undefined };
// }

/**
 * Best-effort logger that never throws (swallows errors).
 * Use this in catch blocks or non-critical paths.
 */
// export async function tryLogEvent(input: LogEventInput): Promise<void> {
//   try {
//     await logEvent(input);
//   } catch {
//     // intentionally swallow to avoid cascading failures
//   }
// }

/**
 * Small helper to standardize request_id if caller doesn't pass one.
 */
function safeRequestId() {
  // crypto.randomUUID() is available in modern runtimes
  try {
    return crypto.randomUUID();
  } catch {
    // fallback
    return `req_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
}
