import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Query concept mapping data using Prisma
    const result = await prisma.$queryRaw`
      SELECT id, question, options, correctOption, area, sub_area, topic, sub_topic,
             keywords, concept_filename, concept_filepath, mcq_filename, mcq_filepath, tags, approved
      FROM concept_mapping
    `;

    const formatted = (result as any[]).map((row: any) => ({
      id: row.id.toString(),
      question: row.question,
      options: row.options
        .replace(/(^"|"$)/g, '')
        .split('\\n')
        .map((opt: string) => opt.trim()),
      correctOption: row.correctOption || '',
      area: row.area,
      subArea: row.sub_area,
      topic: row.topic,
      subTopic: row.sub_topic,
      keywords: row.keywords,
      conceptFilename: row.concept_filename,
      conceptFilepath: row.concept_filepath,
      mcqFilename: row.mcq_filename,
      mcqFilepath: row.mcq_filepath,
      tags: row.tags ? JSON.parse(row.tags) : [],
      approved: !!row.approved,
    }));

    return NextResponse.json({ data: formatted });

  } catch (error) {
    console.error('🔥 GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, approved } = await req.json();

    // Update approval status using Prisma
    await prisma.$executeRaw`
      UPDATE concept_mapping
      SET approved = ${approved ? 1 : 0},
          updatedAt = GETDATE()
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Approval status updated' });

  } catch (error) {
    console.error('🔥 PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const {
      id, question, options, correctOption, area, subArea, topic,
      subTopic, keywords, conceptFilename, conceptFilepath,
      mcqFilename, mcqFilepath, tags
    } = await req.json();

    const optionsStr = Array.isArray(options) ? options.join('\\n') : options;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : '[]';

    // Update question using Prisma
    await prisma.$executeRaw`
      UPDATE concept_mapping
      SET
        question = ${question},
        options = ${optionsStr},
        correctOption = ${correctOption || null},
        area = ${area},
        sub_area = ${subArea},
        topic = ${topic},
        sub_topic = ${subTopic},
        keywords = ${keywords},
        concept_filename = ${conceptFilename},
        concept_filepath = ${conceptFilepath},
        mcq_filename = ${mcqFilename},
        mcq_filepath = ${mcqFilepath},
        tags = ${tagsStr},
        updatedAt = GETDATE()
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Question updated successfully' });

  } catch (error) {
    console.error('🔥 PUT error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}
