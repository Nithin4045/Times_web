import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const domain = searchParams.get("domain")

    if (!domain) {
      return new NextResponse(
        JSON.stringify({ error: "Missing domain parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const settings = await prisma.settings.findMany({
      where: {
        SUB_DOMAIN: domain
      },
      select: {
        SETTINGS_JSON: true
      }
    });
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    logger.error(`server error in settings ${error}`)
    console.error("Server error", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to retrieve SETTINGS." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}