import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserAccess } from "@/lib/userContext";

export const dynamic = "force-dynamic";

async function readIdCardNo(req: NextRequest): Promise<string> {
  try {
    if (req.method === "GET") {
      return (req.nextUrl.searchParams.get("id_card_no") ?? "").trim();
    }

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      return String(fd.get("id_card_no") ?? "").trim();
    }

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      return String((body as Record<string, unknown>)?.id_card_no ?? "").trim();
    }

    return "";
  } catch {
    return "";
  }
}

type QueryFilters = {
  year?: number;
  type?: string;
};

function parseFilters(req: NextRequest): QueryFilters {
  const yearStr = req.nextUrl.searchParams.get("year");
  const rawType = req.nextUrl.searchParams.get("type");
  const parsedYear = yearStr ? Number(yearStr) : undefined;

  return {
    year: Number.isFinite(parsedYear as number) ? (parsedYear as number) : undefined,
    type: rawType ? rawType.trim() : undefined,
  };
}

function coercePayload(raw: unknown) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("[magazines] failed to parse JSON payload", error);
      return null;
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return null;
}

function filterCatalog(payload: any, filters: QueryFilters) {
  const catalog: any[] = Array.isArray(payload?.catalog) ? payload.catalog : [];
  if (!filters.year && !filters.type) return catalog;

  return catalog.filter((item) => {
    const matchesYear =
      !filters.year || Number(item?.year) === Number(filters.year);
    const matchesType =
      !filters.type || String(item?.type ?? "").toLowerCase() === filters.type!.toLowerCase();
    return matchesYear && matchesType;
  });
}

function filterOrders(payload: any, allowedCatalogIds: Set<number>) {
  const orders: any[] = Array.isArray(payload?.user_orders) ? payload.user_orders : [];
  if (!allowedCatalogIds.size) return orders;

  return orders.filter((order) =>
    allowedCatalogIds.has(Number(order?.magazine_id ?? order?.magazineId))
  );
}

async function handler(req: NextRequest) {
  try {
    const rawIdCardNo = await readIdCardNo(req);
    if (!rawIdCardNo) {
      return NextResponse.json(
        { success: false, error: "Missing id_card_no" },
        { status: 400 }
      );
    }

    const { year, type } = parseFilters(req);

    const access = await resolveUserAccess({ idCardNo: rawIdCardNo });
    const idCardForQuery = (access as any)?.id_card_no ?? rawIdCardNo;

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      "SELECT public.get_magazines($1) AS data",
      idCardForQuery
    );

    const row = rows?.[0] ?? null;
    const raw = row?.data ?? row?.get_magazines ?? row;
    const payload = coercePayload(raw);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "No magazine data" },
        { status: 404 }
      );
    }

    const catalog = filterCatalog(payload, { year, type });
    const allowedIds = new Set(catalog.map((item) => Number(item?.id)));
    const userOrders = filterOrders(payload, allowedIds.size ? allowedIds : new Set());

    const responseBody = {
      ...(payload ?? {}),
      user: {
        ...(payload?.user ?? {}),
        id_card_no: idCardForQuery,
      },
      meta: {
        ...(payload?.meta ?? {}),
        filters: {
          ...(payload?.meta?.filters ?? {}),
          ...(year ? { year } : {}),
          ...(type ? { type } : {}),
        },
      },
      catalog,
      user_orders: year || type ? userOrders : payload?.user_orders ?? [],
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("[magazines] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
