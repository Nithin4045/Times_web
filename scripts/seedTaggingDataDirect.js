// Direct database seeding script for tagging_data
// This script will add sample taxonomy data to the tagging_data table

const sampleData = [
  // MATHEMATICS
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Linear Equations', sub_topic: 'Single Variable' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Linear Equations', sub_topic: 'Two Variables' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Linear Equations', sub_topic: 'Systems of Equations' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Quadratic Equations', sub_topic: 'Factoring' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Quadratic Equations', sub_topic: 'Quadratic Formula' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Quadratic Equations', sub_topic: 'Graphing Parabolas' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Polynomials', sub_topic: 'Operations' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Polynomials', sub_topic: 'Factoring' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Rational Expressions', sub_topic: 'Simplifying' },
  { area: 'Mathematics', sub_area: 'Algebra', topic: 'Rational Expressions', sub_topic: 'Operations' },

  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Triangles', sub_topic: 'Properties' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Triangles', sub_topic: 'Pythagorean Theorem' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Triangles', sub_topic: 'Trigonometry' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Circles', sub_topic: 'Properties' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Circles', sub_topic: 'Area and Circumference' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Circles', sub_topic: 'Angles and Arcs' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Quadrilaterals', sub_topic: 'Properties' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: 'Quadrilaterals', sub_topic: 'Area and Perimeter' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: '3D Shapes', sub_topic: 'Volume and Surface Area' },
  { area: 'Mathematics', sub_area: 'Geometry', topic: '3D Shapes', sub_topic: 'Properties' },

  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Limits', sub_topic: 'Concept' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Limits', sub_topic: 'Techniques' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Derivatives', sub_topic: 'Definition' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Derivatives', sub_topic: 'Rules' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Derivatives', sub_topic: 'Applications' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Integrals', sub_topic: 'Definition' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Integrals', sub_topic: 'Techniques' },
  { area: 'Mathematics', sub_area: 'Calculus', topic: 'Integrals', sub_topic: 'Applications' },

  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Descriptive Statistics', sub_topic: 'Measures of Central Tendency' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Descriptive Statistics', sub_topic: 'Measures of Spread' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Probability', sub_topic: 'Basic Concepts' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Probability', sub_topic: 'Conditional Probability' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Probability', sub_topic: 'Distributions' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Inferential Statistics', sub_topic: 'Hypothesis Testing' },
  { area: 'Mathematics', sub_area: 'Statistics', topic: 'Inferential Statistics', sub_topic: 'Confidence Intervals' },

  // PHYSICS
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Kinematics', sub_topic: 'Linear Motion' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Kinematics', sub_topic: 'Projectile Motion' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Kinematics', sub_topic: 'Circular Motion' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Dynamics', sub_topic: 'Newton\'s Laws' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Dynamics', sub_topic: 'Force and Motion' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Dynamics', sub_topic: 'Friction' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Energy', sub_topic: 'Work and Power' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Energy', sub_topic: 'Kinetic and Potential' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Energy', sub_topic: 'Conservation' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Momentum', sub_topic: 'Linear Momentum' },
  { area: 'Physics', sub_area: 'Mechanics', topic: 'Momentum', sub_topic: 'Collisions' },

  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Heat', sub_topic: 'Temperature and Heat' },
  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Heat', sub_topic: 'Heat Transfer' },
  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Laws', sub_topic: 'First Law' },
  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Laws', sub_topic: 'Second Law' },
  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Gas Laws', sub_topic: 'Ideal Gas Law' },
  { area: 'Physics', sub_area: 'Thermodynamics', topic: 'Gas Laws', sub_topic: 'Kinetic Theory' },

  { area: 'Physics', sub_area: 'Waves and Oscillations', topic: 'Simple Harmonic Motion', sub_topic: 'Properties' },
  { area: 'Physics', sub_area: 'Waves and Oscillations', topic: 'Simple Harmonic Motion', sub_topic: 'Energy' },
  { area: 'Physics', sub_area: 'Waves and Oscillations', topic: 'Waves', sub_topic: 'Properties' },
  { area: 'Physics', sub_area: 'Waves and Oscillations', topic: 'Waves', sub_topic: 'Sound Waves' },
  { area: 'Physics', sub_area: 'Waves and Oscillations', topic: 'Waves', sub_topic: 'Light Waves' },

  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Electrostatics', sub_topic: 'Coulomb\'s Law' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Electrostatics', sub_topic: 'Electric Fields' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Electrostatics', sub_topic: 'Electric Potential' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Current Electricity', sub_topic: 'Ohm\'s Law' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Current Electricity', sub_topic: 'Circuits' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Magnetism', sub_topic: 'Magnetic Fields' },
  { area: 'Physics', sub_area: 'Electricity and Magnetism', topic: 'Magnetism', sub_topic: 'Electromagnetic Induction' },

  // CHEMISTRY
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Atoms', sub_topic: 'Structure' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Atoms', sub_topic: 'Electron Configuration' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Periodic Table', sub_topic: 'Trends' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Periodic Table', sub_topic: 'Properties' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Bonding', sub_topic: 'Ionic Bonding' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Bonding', sub_topic: 'Covalent Bonding' },
  { area: 'Chemistry', sub_area: 'Atomic Structure', topic: 'Bonding', sub_topic: 'Metallic Bonding' },

  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Types', sub_topic: 'Synthesis' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Types', sub_topic: 'Decomposition' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Types', sub_topic: 'Single Replacement' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Types', sub_topic: 'Double Replacement' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Balancing', sub_topic: 'Equations' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Stoichiometry', sub_topic: 'Mole Calculations' },
  { area: 'Chemistry', sub_area: 'Chemical Reactions', topic: 'Stoichiometry', sub_topic: 'Limiting Reactants' },

  { area: 'Chemistry', sub_area: 'Acids and Bases', topic: 'Properties', sub_topic: 'Definitions' },
  { area: 'Chemistry', sub_area: 'Acids and Bases', topic: 'Properties', sub_topic: 'pH Scale' },
  { area: 'Chemistry', sub_area: 'Acids and Bases', topic: 'Reactions', sub_topic: 'Neutralization' },
  { area: 'Chemistry', sub_area: 'Acids and Bases', topic: 'Reactions', sub_topic: 'Buffer Solutions' },

  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Hydrocarbons', sub_topic: 'Alkanes' },
  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Hydrocarbons', sub_topic: 'Alkenes' },
  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Hydrocarbons', sub_topic: 'Alkynes' },
  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Functional Groups', sub_topic: 'Alcohols' },
  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Functional Groups', sub_topic: 'Aldehydes' },
  { area: 'Chemistry', sub_area: 'Organic Chemistry', topic: 'Functional Groups', sub_topic: 'Ketones' },

  // BIOLOGY
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Structure', sub_topic: 'Organelles' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Structure', sub_topic: 'Cell Membrane' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Processes', sub_topic: 'Respiration' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Processes', sub_topic: 'Photosynthesis' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Division', sub_topic: 'Mitosis' },
  { area: 'Biology', sub_area: 'Cell Biology', topic: 'Cell Division', sub_topic: 'Meiosis' },

  { area: 'Biology', sub_area: 'Genetics', topic: 'Mendelian Genetics', sub_topic: 'Laws of Inheritance' },
  { area: 'Biology', sub_area: 'Genetics', topic: 'Mendelian Genetics', sub_topic: 'Punnett Squares' },
  { area: 'Biology', sub_area: 'Genetics', topic: 'Molecular Genetics', sub_topic: 'DNA Structure' },
  { area: 'Biology', sub_area: 'Genetics', topic: 'Molecular Genetics', sub_topic: 'Protein Synthesis' },
  { area: 'Biology', sub_area: 'Genetics', topic: 'Molecular Genetics', sub_topic: 'Mutations' },

  { area: 'Biology', sub_area: 'Ecology', topic: 'Ecosystems', sub_topic: 'Components' },
  { area: 'Biology', sub_area: 'Ecology', topic: 'Ecosystems', sub_topic: 'Energy Flow' },
  { area: 'Biology', sub_area: 'Ecology', topic: 'Populations', sub_topic: 'Growth' },
  { area: 'Biology', sub_area: 'Ecology', topic: 'Populations', sub_topic: 'Interactions' },
  { area: 'Biology', sub_area: 'Ecology', topic: 'Conservation', sub_topic: 'Biodiversity' },

  // ENGLISH
  { area: 'English', sub_area: 'Grammar', topic: 'Parts of Speech', sub_topic: 'Nouns' },
  { area: 'English', sub_area: 'Grammar', topic: 'Parts of Speech', sub_topic: 'Verbs' },
  { area: 'English', sub_area: 'Grammar', topic: 'Parts of Speech', sub_topic: 'Adjectives' },
  { area: 'English', sub_area: 'Grammar', topic: 'Parts of Speech', sub_topic: 'Adverbs' },
  { area: 'English', sub_area: 'Grammar', topic: 'Sentence Structure', sub_topic: 'Simple Sentences' },
  { area: 'English', sub_area: 'Grammar', topic: 'Sentence Structure', sub_topic: 'Compound Sentences' },
  { area: 'English', sub_area: 'Grammar', topic: 'Sentence Structure', sub_topic: 'Complex Sentences' },
  { area: 'English', sub_area: 'Grammar', topic: 'Tenses', sub_topic: 'Present Tense' },
  { area: 'English', sub_area: 'Grammar', topic: 'Tenses', sub_topic: 'Past Tense' },
  { area: 'English', sub_area: 'Grammar', topic: 'Tenses', sub_topic: 'Future Tense' },

  { area: 'English', sub_area: 'Literature', topic: 'Poetry', sub_topic: 'Elements' },
  { area: 'English', sub_area: 'Literature', topic: 'Poetry', sub_topic: 'Forms' },
  { area: 'English', sub_area: 'Literature', topic: 'Prose', sub_topic: 'Fiction' },
  { area: 'English', sub_area: 'Literature', topic: 'Prose', sub_topic: 'Non-fiction' },
  { area: 'English', sub_area: 'Literature', topic: 'Drama', sub_topic: 'Elements' },
  { area: 'English', sub_area: 'Literature', topic: 'Drama', sub_topic: 'Types' },

  { area: 'English', sub_area: 'Composition', topic: 'Essay Writing', sub_topic: 'Structure' },
  { area: 'English', sub_area: 'Composition', topic: 'Essay Writing', sub_topic: 'Types' },
  { area: 'English', sub_area: 'Composition', topic: 'Creative Writing', sub_topic: 'Narrative' },
  { area: 'English', sub_area: 'Composition', topic: 'Creative Writing', sub_topic: 'Descriptive' },

  // GENERAL KNOWLEDGE
  { area: 'General Knowledge', sub_area: 'History', topic: 'Ancient History', sub_topic: 'Civilizations' },
  { area: 'General Knowledge', sub_area: 'History', topic: 'Medieval History', sub_topic: 'Empires' },
  { area: 'General Knowledge', sub_area: 'History', topic: 'Modern History', sub_topic: 'World Wars' },
  { area: 'General Knowledge', sub_area: 'History', topic: 'Modern History', sub_topic: 'Independence Movements' },

  { area: 'General Knowledge', sub_area: 'Geography', topic: 'Physical Geography', sub_topic: 'Landforms' },
  { area: 'General Knowledge', sub_area: 'Geography', topic: 'Physical Geography', sub_topic: 'Climate' },
  { area: 'General Knowledge', sub_area: 'Geography', topic: 'Human Geography', sub_topic: 'Population' },
  { area: 'General Knowledge', sub_area: 'Geography', topic: 'Human Geography', sub_topic: 'Urbanization' },

  { area: 'General Knowledge', sub_area: 'Current Affairs', topic: 'Politics', sub_topic: 'Government Systems' },
  { area: 'General Knowledge', sub_area: 'Current Affairs', topic: 'Politics', sub_topic: 'International Relations' },
  { area: 'General Knowledge', sub_area: 'Current Affairs', topic: 'Economics', sub_topic: 'Basic Concepts' },
  { area: 'General Knowledge', sub_area: 'Current Affairs', topic: 'Economics', sub_topic: 'Global Economy' },

  { area: 'General Knowledge', sub_area: 'Science and Technology', topic: 'Space', sub_topic: 'Solar System' },
  { area: 'General Knowledge', sub_area: 'Science and Technology', topic: 'Space', sub_topic: 'Space Exploration' },
  { area: 'General Knowledge', sub_area: 'Science and Technology', topic: 'Technology', sub_topic: 'Computers' },
  { area: 'General Knowledge', sub_area: 'Science and Technology', topic: 'Technology', sub_topic: 'Internet' },

  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Olympics', sub_topic: 'History' },
  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Olympics', sub_topic: 'Events' },
  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Cricket', sub_topic: 'Rules' },
  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Cricket', sub_topic: 'History' },
  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Football', sub_topic: 'Rules' },
  { area: 'General Knowledge', sub_area: 'Sports', topic: 'Football', sub_topic: 'World Cup' }
];

async function addTaggingData() {
  try {
    console.log('🌱 Adding sample data to tagging_data table...');
    console.log(`📝 Found ${sampleData.length} entries to add`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of sampleData) {
      try {
        const response = await fetch('http://localhost:3000/api/palms/tagging_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            area: item.area,
            sub_area: item.sub_area,
            topic: item.topic,
            sub_topic: item.sub_topic,
            user_id: null
          })
        });

        if (response.ok) {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✅ Added ${successCount} entries...`);
          }
        } else {
          errorCount++;
          console.error(`❌ Error adding entry: ${item.area} > ${item.sub_area} > ${item.topic} > ${item.sub_topic}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Network error for entry: ${item.area} > ${item.sub_area} > ${item.topic} > ${item.sub_topic}`);
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`✅ Successfully added: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);

    // Verify the data was added
    try {
      const verifyResponse = await fetch('http://localhost:3000/api/palms/tagging_data');
      const verifyData = await verifyResponse.json();
      console.log(`📊 Total records in tagging_data table: ${verifyData.count}`);
    } catch (error) {
      console.log('⚠️ Could not verify data count');
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
  }
}

// Run the seeding function
addTaggingData();
