// app/api/get-test-descriptions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all tests with module = 2
    const tests = await prisma.test_repository.findMany({
      where: {
        module: 2
      }
    });

    if (!tests || tests.length === 0) {
      return NextResponse.json(
        { message: 'No test descriptions found for module 2' },
        { status: 404 }
      );
    }

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error('Error fetching test descriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
