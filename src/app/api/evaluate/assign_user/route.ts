import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, testId, validityStart, validityEnd } = body;

        // ✅ Validate input
        if (!userId || !testId) {
            return NextResponse.json(
                { error: "Missing userId or testId" },
                { status: 400 }
            );
        }
        if (!validityStart || !validityEnd) {
            return NextResponse.json(
                { error: "Missing validityStart or validityEnd" },
                { status: 400 }
            );
        }

        const existing = await prisma.user_tests.findFirst({
            where: {
                user_id: userId,
                test_id: testId,
            },
        });

        if (existing) {
            return NextResponse.json({
                message: "User already has a test assigned.",
                user_test: existing,
            }, { status: 200 });
        }

        const newUserTest = await prisma.user_tests.create({
            data: {
                user_id: userId,
                test_id: testId,
                created_date: new Date(),
                module: "3", // optional default module value
                created_by: userId, // or set to admin ID if needed
                validity_start: validityStart,
                validity_end: validityEnd
            },
        });

        return NextResponse.json(
            {
                message: "User test assigned successfully.",
                user_test: newUserTest,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error assigning user test:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
