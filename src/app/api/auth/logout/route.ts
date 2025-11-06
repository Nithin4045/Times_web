import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    console.log('Logout attempt for user ID:', userId);

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        message: 'Database connection failed', 
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Delete the session record for the user using Prisma's built-in methods
    const result = await prisma.session.deleteMany({
      where: {
        userId: parseInt(userId),
        status: 1
      }
    });

    console.log('Session deletion result:', result);

    return NextResponse.json({ message: 'User session deleted successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Return a more specific error message
    if (error instanceof Error) {
      return NextResponse.json({ 
        message: 'Logout failed', 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
