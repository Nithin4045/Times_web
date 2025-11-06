import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";

export interface UserAccessContext {
  userId: number | null;
  id_card_no: string | null;
  selected_course_id: number | null;
  is_free_user: boolean;
}

type ResolveParams = {
  idCardNo?: string | null;
  selectedCourseId?: number | null;
};

function normalizeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return Math.trunc(parsed);
  }
  return null;
}

export async function resolveUserAccess(params: ResolveParams = {}): Promise<UserAccessContext> {
  const session = await getServerSession(options);
  const sessionUser = (session as any)?.user ?? null;

  let resolvedIdCard = params.idCardNo ?? (sessionUser?.id_card_no ?? null);
  if (typeof resolvedIdCard === "string") {
    resolvedIdCard = resolvedIdCard.trim();
    if (!resolvedIdCard.length) {
      resolvedIdCard = null;
    }
  } else {
    resolvedIdCard = null;
  }

  let resolvedCourseId = params.selectedCourseId ?? (sessionUser?.selected_course_id ?? null);
  if (typeof resolvedCourseId === "string") {
    const parsed = Number(resolvedCourseId);
    resolvedCourseId = Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  const userId = normalizeId(sessionUser?.id ?? null);

  if ((!resolvedCourseId || !resolvedIdCard) && userId) {
    const dbUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { selected_course_id: true, id_card_no: true },
    });
    if (dbUser) {
      if (!resolvedCourseId && dbUser.selected_course_id != null) {
        resolvedCourseId = dbUser.selected_course_id;
      }
      if (!resolvedIdCard && dbUser.id_card_no) {
        resolvedIdCard = dbUser.id_card_no;
      }
    }
  }

  return {
    userId,
    id_card_no: resolvedIdCard ?? null,
    selected_course_id: resolvedCourseId ?? null,
    is_free_user: !resolvedIdCard,
  };
}