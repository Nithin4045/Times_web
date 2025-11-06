// src/app/api/admin/lookups/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [cities, centers, courses, talRows, users] = await Promise.all([
            prisma.city.findMany({ select: { id: true, city: true }, orderBy: { city: "asc" } }),
            prisma.centers.findMany({ select: { id: true, center: true }, orderBy: { center: "asc" } }),
            prisma.courses.findMany({ select: { id: true, coursename: true }, orderBy: { coursename: "asc" } }),
            prisma.tests_area_level.findMany({
                select: { id: true, area: true, level: true },
                orderBy: [{ area: "asc" }, { level: "asc" }],
            }),
            prisma.users.findMany({ 
                select: { id_card_no: true, firstname: true, lastname: true }, 
                orderBy: { id_card_no: "asc" } 
            }),
        ]);

        const areaLevels: Record<string, { level: string; id: number }[]> = {};
        talRows.forEach((r) => {
            const key = r.area.trim();               // normalize
            if (!areaLevels[key]) areaLevels[key] = [];
            areaLevels[key].push({ level: r.level.trim(), id: r.id });
        });

        return NextResponse.json({
            success: true,
            data: {
                cities: cities.map((c) => ({ id: c.id, label: c.city })),
                centers: centers.map((c) => ({ id: c.id, label: c.center })),
                courses: courses.map((c) => ({ id: c.id, label: c.coursename })),
                areas: Object.keys(areaLevels),
                areaLevels,
                users: users.map((u) => ({ 
                    id_card_no: u.id_card_no, 
                    label: `${u.id_card_no} - ${u.firstname} ${u.lastname}` 
                })),
            },
        });
    } catch (e: any) {
        console.error("GET /api/admin/lookups error", e);
        return NextResponse.json({ success: false, error: e.message || "Lookup fetch failed" }, { status: 500 });
    }
}
