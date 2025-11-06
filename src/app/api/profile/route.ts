// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { decryptForClient, encryptForStorage } from '@/lib/obfuscator';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function GET(req: NextRequest) {
  const session = await getServerSession(options);

  const sessionUser = (session?.user as any);
  const sessionId = sessionUser?.id;
  const sessionIdCard = sessionUser?.id_card_no;
  const sessionEmail = sessionUser?.email;

  console.log('[Profile GET] Session data - id:', sessionId, 'id_card_no:', sessionIdCard, 'email:', sessionEmail ? '[present]' : '[missing]');

  // Try to find user by session ID first (most reliable)
  let user = null;
  
  if (sessionId) {
    const userId = typeof sessionId === 'string' ? parseInt(sessionId, 10) : sessionId;
    if (!isNaN(userId)) {
      user = await prisma.users.findUnique({ where: { id: userId } });
      console.log('[Profile GET] Found by session id:', !!user);
    }
  }
  
  // Fallback: try id_card_no
  if (!user && sessionIdCard) {
    user = await prisma.users.findFirst({ where: { id_card_no: sessionIdCard } });
    console.log('[Profile GET] Found by id_card_no:', !!user);
  }
  
  // Fallback: try email
  if (!user && sessionEmail) {
    const enc = encryptForStorage(sessionEmail);
    user =
      (await prisma.users.findFirst({ where: { email: enc } })) ||
      (await prisma.users.findFirst({ where: { email: sessionEmail } }));
    console.log('[Profile GET] Found by email:', !!user);
  }

  if (!user) {
    console.log('[Profile GET] User not found with any method');
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Fetch user course info with batch details
  const userCourse = await prisma.users_courses.findFirst({
    where: { id_card_no: user.id_card_no ?? '' },
    orderBy: { created_at: 'desc' }
  });

  // Fetch batch details if userCourse exists
  let batch: any = null;
  let cityInfo: any = null;
  let centerInfo: any = null;
  let courseInfo: any = null;
  let variantInfo: any = null;

  if (userCourse?.batch_id) {
    batch = await prisma.batches.findUnique({
      where: { id: userCourse.batch_id }
    });

    if (batch) {
      // Fetch related data separately
      if (batch.city_id) {
        cityInfo = await prisma.city.findUnique({
          where: { id: batch.city_id }
        });
      }

      if (batch.center_id) {
        centerInfo = await prisma.centers.findUnique({
          where: { id: batch.center_id }
        });
      }

      if (batch.course_id) {
        courseInfo = await prisma.courses.findUnique({
          where: { id: batch.course_id }
        });

        if (courseInfo?.variant_id) {
          variantInfo = await prisma.variants.findUnique({
            where: { id: courseInfo.variant_id }
          });
        }
      }
    }
  }

  const resp = {
    id: user.id,
    id_card_no: user.id_card_no ?? null,
    email: decryptForClient(user.email ?? ''), // safe even if not encrypted
    mobile: decryptForClient(user.mobile ?? ''), // ✅ Decrypt mobile number for display
    photo: user.photo ?? null,
    firstname: user.firstname,
    lastname: user.lastname,
    address: user.address ?? null,
    // Course enrollment details
    batch_id: userCourse?.batch_id ?? null,
    batch_code: batch?.batch_code ?? null,
    city_id: batch?.city_id ?? null,
    city_name: cityInfo?.city ?? null,
    center_id: batch?.center_id ?? null,
    center_name: centerInfo?.name ?? null,
    variant_id: courseInfo?.variant_id ?? null,
    variant_name: variantInfo?.variant ?? null,
    course_id: batch?.course_id ?? null,
    course_name: courseInfo?.coursename ?? null,
  };
  return NextResponse.json({ success: true, user: resp });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  console.log('[Profile PUT] Received body:', { ...body, email: body.email ? '[redacted]' : undefined });

  // Prefer id_card_no as identifier (most reliable)
  const identifier: string | undefined = body.id_card_no ?? body.email;
  if (!identifier) {
    return NextResponse.json({ success: false, error: 'identifier required' }, { status: 400 });
  }

  console.log('[Profile PUT] Looking for user with identifier:', identifier);

  // Locate user by id_card_no first (most reliable)
  let user = await prisma.users.findFirst({ where: { id_card_no: String(identifier) } });

  // If not found by id_card_no, try email (encrypted or plain)
  if (!user) {
    const enc = encryptForStorage(String(identifier));
    user =
      (await prisma.users.findFirst({ where: { email: enc } })) ||
      (await prisma.users.findFirst({ where: { email: String(identifier) } }));
  }

  if (!user) {
    console.log('[Profile PUT] User not found');
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  console.log('[Profile PUT] Found user with id:', user.id);

  // Prepare update data - DO NOT update email (it's already encrypted in DB)
  const updateData: any = {
    firstname: body.firstname ?? undefined,
    lastname: body.lastname ?? undefined,
    mobile: body.mobile ?? undefined,
    photo: body.photo ?? undefined,
    address: body.address ?? undefined,
  };

  console.log('[Profile PUT] Updating with data:', updateData);

  const updated = await prisma.users.update({
    where: { id: user.id }, // id is unique, so update via id is correct
    data: updateData,
  });

  // Fetch user course info with batch details
  const userCourse = await prisma.users_courses.findFirst({
    where: { id_card_no: updated.id_card_no ?? '' },
    orderBy: { created_at: 'desc' }
  });

  // Fetch batch details if userCourse exists
  let batch: any = null;
  let cityInfo: any = null;
  let centerInfo: any = null;
  let courseInfo: any = null;
  let variantInfo: any = null;

  if (userCourse?.batch_id) {
    batch = await prisma.batches.findUnique({
      where: { id: userCourse.batch_id }
    });

    if (batch) {
      // Fetch related data separately
      if (batch.city_id) {
        cityInfo = await prisma.city.findUnique({
          where: { id: batch.city_id }
        });
      }

      if (batch.center_id) {
        centerInfo = await prisma.centers.findUnique({
          where: { id: batch.center_id }
        });
      }

      if (batch.course_id) {
        courseInfo = await prisma.courses.findUnique({
          where: { id: batch.course_id }
        });

        if (courseInfo?.variant_id) {
          variantInfo = await prisma.variants.findUnique({
            where: { id: courseInfo.variant_id }
          });
        }
      }
    }
  }

  const resp = {
    id: updated.id,
    id_card_no: updated.id_card_no ?? null,
    email: decryptForClient(updated.email ?? ''),
    mobile: decryptForClient(updated.mobile ?? ''), // ✅ Decrypt mobile number for display
    photo: updated.photo ?? null,
    firstname: updated.firstname,
    lastname: updated.lastname,
    address: updated.address ?? null,
    // Course enrollment details
    batch_id: userCourse?.batch_id ?? null,
    batch_code: batch?.batch_code ?? null,
    city_id: batch?.city_id ?? null,
    city_name: cityInfo?.city ?? null,
    center_id: batch?.center_id ?? null,
    center_name: centerInfo?.name ?? null,
    variant_id: courseInfo?.variant_id ?? null,
    variant_name: variantInfo?.variant ?? null,
    course_id: batch?.course_id ?? null,
    course_name: courseInfo?.coursename ?? null,
  };

  console.log('[Profile PUT] Update successful');
  return NextResponse.json({ success: true, user: resp });
}
