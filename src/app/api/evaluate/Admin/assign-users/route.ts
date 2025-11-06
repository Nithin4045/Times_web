import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { options, test_id, CreatedBy } = await req.json();

    if (!Array.isArray(options) || !options.length) {
      return NextResponse.json({ error: 'Batch codes array required.' }, { status: 400 });
    }

      console.log('Received data:', { options, test_id, CreatedBy });

    const tid = Number(test_id);
    const uid = Number(CreatedBy);
    if (!Number.isFinite(tid) || !Number.isFinite(uid)) {
      return NextResponse.json({ error: 'Invalid test_id or CreatedBy.' }, { status: 400 });
    }

    const batchCodes = options.join(',');
    console.log('Assigning users with batch codes:', batchCodes, 'to test ID:', tid, 'by user ID:', uid);

    await prisma.$executeRaw`SELECT insert_eval_user_tests_by_batch(${batchCodes}::text, ${tid}::int, ${uid}::int)`;


    return NextResponse.json({ success: true, message: 'Users assigned to test successfully.' });
  } catch (error: any) {
    logger.error(`API Error in assign users: ${error.message}`);
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error assigning users', details: error.message }, { status: 500 });
  }
}
