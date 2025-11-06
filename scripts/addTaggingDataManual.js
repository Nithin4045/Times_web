// Manual script to add a few sample entries to tagging_data table
// This can be run to test the functionality

const sampleEntries = [
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Linear Equations', sub_topic: 'Single Variable' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Quadratic Equations', sub_topic: 'Factoring' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Triangles', sub_topic: 'Pythagorean Theorem' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Kinematics', sub_topic: 'Linear Motion' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Dynamics', sub_topic: 'Newton\'s Laws' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Atoms', sub_topic: 'Structure' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Structure', sub_topic: 'Organelles' },
  { area: 'English', sub_area: 'Grammar', topic: 'Parts of Speech', sub_topic: 'Nouns' },
  { area: 'General Knowledge', sub_area: 'History', topic: 'Ancient History', sub_topic: 'Civilizations' }
];

async function addSampleData() {
  console.log('🌱 Adding sample tagging data...');
  console.log(`📝 Adding ${sampleEntries.length} sample entries`);

  for (const entry of sampleEntries) {
    try {
      console.log(`Adding: ${entry.area} > ${entry.sub_area} > ${entry.topic} > ${entry.sub_topic}`);
      
      const response = await fetch('http://localhost:3000/api/palms/tagging_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: entry.area,
          sub_area: entry.sub_area,
          topic: entry.topic,
          sub_topic: entry.sub_topic,
          user_id: null
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.message}`);
      } else {
        const error = await response.json();
        console.log(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }

  // Verify data
  try {
    console.log('\n🔍 Verifying data...');
    const verifyResponse = await fetch('http://localhost:3000/api/palms/tagging_data');
    const verifyData = await verifyResponse.json();
    console.log(`📊 Total records in tagging_data table: ${verifyData.count}`);
    
    if (verifyData.data && verifyData.data.length > 0) {
      console.log('\n📋 Sample records:');
      verifyData.data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.area} > ${item.sub_area} > ${item.topic} > ${item.sub_topic}`);
      });
    }
  } catch (error) {
    console.log('⚠️ Could not verify data');
  }
}

addSampleData();
