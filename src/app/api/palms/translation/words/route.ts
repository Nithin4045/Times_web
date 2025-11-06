import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/palms/translation/words
 * Fetches all non-deleted translation words from the database
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Fetching translation words from database (deleted = 0)');

    const words = await prisma.translation_words.findMany({
      where: {
        deleted: 0  // Only fetch non-deleted words
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`✅ Found ${words.length} active translation words`);

    // Format for frontend
    const formattedWords = words.map(w => ({
      id: w.id,
      word: w.words,
      context: w.context || ""
    }));

    return NextResponse.json({
      success: true,
      words: formattedWords,
      count: words.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching translation words:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch translation words',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/palms/translation/words
 * Adds a new translation word OR context to the database or restores a soft-deleted one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, context, type } = body;

    // Validate: must have either word or context
    const hasWord = word && typeof word === 'string' && word.trim();
    const hasContext = context && typeof context === 'string' && context.trim();

    if (!hasWord && !hasContext) {
      return NextResponse.json(
        { error: 'Either word or context must be provided' },
        { status: 400 }
      );
    }

    const trimmedWord = hasWord ? word.trim() : null;
    const trimmedContext = hasContext ? context.trim() : null;

    console.log(`📝 Adding translation ${type || 'entry'}: word="${trimmedWord}", context="${trimmedContext}"`);

    // Build search criteria - check based on what's being added
    let searchWhere: any = {};
    if (trimmedWord && !trimmedContext) {
      // Adding word only - check for word with no context
      searchWhere = { 
        words: trimmedWord,
        OR: [
          { context: null },
          { context: "" }
        ]
      };
    } else if (!trimmedWord && trimmedContext) {
      // Adding context only - check for context with no word
      searchWhere = { 
        context: trimmedContext,
        OR: [
          { words: null },
          { words: "" }
        ]
      };
    } else if (trimmedWord && trimmedContext) {
      // Adding both - check for exact match
      searchWhere = { words: trimmedWord, context: trimmedContext };
    }

    // Check if entry already exists (including soft-deleted)
    const existing = await prisma.translation_words.findFirst({
      where: searchWhere
    });

    if (existing) {
      // If entry exists but is deleted, restore it
      if (existing.deleted === 1) {
        console.log(`♻️ Restoring previously deleted entry ID: ${existing.id}`);
        const restored = await prisma.translation_words.update({
          where: { id: existing.id },
          data: {
            deleted: 0,
            updated_at: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          word: {
            id: restored.id,
            word: restored.words || "",
            context: restored.context || ""
          },
          restored: true
        }, { status: 200 });
      }

      // Entry exists and is not deleted
      return NextResponse.json(
        { error: 'This entry already exists in the database' },
        { status: 400 }
      );
    }

    // Create new entry
    const created = await prisma.translation_words.create({
      data: {
        words: trimmedWord,      // Can be null now
        context: trimmedContext, // Can be null now
        deleted: 0
      }
    });

    console.log(`✅ Translation entry added with ID: ${created.id} (word: ${!!trimmedWord}, context: ${!!trimmedContext})`);

    return NextResponse.json({
      success: true,
      word: {
        id: created.id,
        word: created.words || "",
        context: created.context || ""
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error adding translation entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add translation entry',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/palms/translation/words
 * Soft deletes a translation word by setting deleted = 1
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Soft deleting translation word with ID: ${id}`);

    // Soft delete by setting deleted = 1
    const updated = await prisma.translation_words.update({
      where: { id },
      data: {
        deleted: 1,
        updated_at: new Date()
      }
    });

    console.log(`✅ Translation word soft deleted successfully (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: 'Translation word deleted successfully',
      word: updated.words
    });

  } catch (error: any) {
    console.error('❌ Error deleting translation word:', error);
    
    // Handle not found error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Translation word not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete translation word',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/palms/translation/words
 * Updates a translation word by ID (only non-deleted records)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, word, context } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'ID is required and must be a number' },
        { status: 400 }
      );
    }

    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json(
        { error: 'Word is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log(`✏️ Updating translation word ID: ${id}`);

    // First check if the record exists and is not deleted
    const existing = await prisma.translation_words.findFirst({
      where: { 
        id,
        deleted: 0
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Translation word not found or has been deleted' },
        { status: 404 }
      );
    }

    const updated = await prisma.translation_words.update({
      where: { id },
      data: {
        words: word.trim(),
        context: context ? context.trim() : null,
        updated_at: new Date()
      }
    });

    console.log(`✅ Translation word updated successfully`);

    return NextResponse.json({
      success: true,
      word: {
        id: updated.id,
        word: updated.words,
        context: updated.context || ""
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating translation word:', error);
    
    // Handle not found error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Translation word not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update translation word',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
