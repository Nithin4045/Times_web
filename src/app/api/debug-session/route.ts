import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });

  return NextResponse.json({
    hasToken: !!token,
    tokenData: token,
    headers: {
      cookie: req.headers.get('cookie'),
      authorization: req.headers.get('authorization'),
    },
    url: req.url,
    method: req.method,
  });
}
