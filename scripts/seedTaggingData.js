import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function seedTaggingData() {
  try {
    console.log('🌱 Starting to seed tagging_data table...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'seed_tagging_data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} INSERT statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      try {
        await prisma.$executeRawUnsafe(statements[i]);
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ Processed ${successCount} statements...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`✅ Successfully inserted: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);

    // Verify the data was inserted
    const count = await prisma.tagging_data.count({
      where: { deleted: 0 }
    });
    console.log(`📊 Total records in tagging_data table: ${count}`);

    // Show sample data
    const sampleData = await prisma.tagging_data.findMany({
      where: { deleted: 0 },
      take: 5,
      select: {
        id: true,
        area: true,
        sub_area: true,
        topic: true,
        sub_topic: true
      }
    });

    console.log('\n📋 Sample data:');
    sampleData.forEach(item => {
      console.log(`  ${item.id}. ${item.area} > ${item.sub_area} > ${item.topic} > ${item.sub_topic}`);
    });

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedTaggingData();
